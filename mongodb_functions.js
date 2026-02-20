function get_kind(entity) {
	return get_kind_from_id(get_id(entity));
}

function get_kind_from_id(id) {
	if (id.startsWith("LT")) return "lottery";
	if (id.startsWith("RC")) return "wallet";
	if (id.startsWith("PZ")) return "puzzle";
	if (id.startsWith("TK")) return "ticket";
	if (id.startsWith("US")) return "user";
	if (id.startsWith("CH")) return "character";
	if (id.startsWith("MP")) return "map";
	if (id.startsWith("SR")) return "server";
	if (id.startsWith("MK")) return "mark";
	if (id.startsWith("BC")) return "backup";
	if (id.startsWith("GU")) return "guild";
	if (id.startsWith("PT")) return "pet";
	if (id.startsWith("MS")) return "message";
	if (id.startsWith("ML")) return "mail";
	if (id.startsWith("EV")) return "event";
	if (id.startsWith("IE")) return "infoelement";
	if (id.startsWith("UL")) return "upload";
	if (id.startsWith("IP")) return "ip";
	console.error(id);
	throw "no_kind";
	return null;
}

function get_id(e) {
	return e._id;
}

function post_get(entity) {
	if (entity) {
		var kind = get_kind(entity);
		if (models[kind] && models[kind].post) models[kind].post(entity);
	}
	return entity;
}

async function backup_entity(entity) {
	var backup = Object.assign({}, entity);
	backup._id = "BC_" + random_string(29);
	backup.original_id = entity._id;
	backup.model = get_kind(entity);
	backup.backed = new Date();
	await safe_save(backup);
}

function post_process_query_results(results) {
	results &&
		results.forEach(function (entity) {
			post_get(entity);
		});
}

async function tx(F, A, tries = 1, backoff = INITIAL_BACKOFF) {
	var R = { failed: false, success: true };
	for (let attempt = 1; attempt <= tries; attempt++) {
		try {
			try {
				var session = client.startSession(),
					ex_reason = null;
				async function tx_save(entity, kind) {
					if (entity.updated) entity.updated = new Date();
					await db
						.collection(kind || get_kind(entity))
						.replaceOne({ _id: entity._id }, entity, { upsert: true, session });
					return true;
				}
				function ex(reason) {
					ex_reason = reason;
					throw ex_reason;
				}
				async function tx_get(id) {
					if (id._id) id = id._id;
					var element = await db.collection(get_kind_from_id(id)).findOne({ _id: id }, { session });
					// console.log(element);
					if (element) return post_get(element);
					return element;
				}
				await session.startTransaction();
				await eval("(" + F.toString() + ")();");
				await session.commitTransaction();
				await session.endSession();

				return R;
			} catch (e) {
				if (!ex_reason) console.error(e);
				await session.abortTransaction();
				await session.endSession();
				if (ex_reason) return { failed: true, reason: ex_reason };
				return { failed: true, reason: "exception" };
			}
		} catch (err) {
			// const isRetryable = err.code === 4 || err.code === 10 || err.code === "ETIMEDOUT"; // 4 = DEADLINE_EXCEEDED, 10 = ABORTED

			if (attempt === tries) {
				// || !isRetryable) {
				console.error(`Transaction failed after ${attempt} attempts`, err);
				throw err;
			}

			const delay = Math.min(backoff * Math.pow(BACKOFF_MULTIPLIER, attempt - 1), 20 * 60 * 1000);
			console.warn(`Transaction failed (attempt ${attempt}), retrying in ${delay}ms...`);
			await new Promise((res) => setTimeout(res, delay));
		}
	}
	return { failed: true, reason: "retries" };
}

async function get(id) {
	var element = await db.collection(get_kind_from_id(id)).findOne({ _id: id });
	// console.log(element);
	if (element) return post_get(element);
	return null;
}

async function fetch_all(kind) {
	var results = await db.collection(kind).find({}).limit(8000).toArray();
	results.forEach(function (element) {
		post_get(element);
	});
	return results;
}

function a_rand(kind) {
	return (models[kind] && models[kind].a_rand && random_number(models[kind].a_rand)) || 0;
}

function to_mongodb(entity, kind, id) {
	return entity;
}

async function safe_save(entity, kind) {
	if (entity.updated) entity.updated = new Date();
	try {
		await save(entity, kind);
		return true;
	} catch (e) {}
	return false;
}

const MAX_TRIES = 5;
const INITIAL_BACKOFF = 1000; // milliseconds
const BACKOFF_MULTIPLIER = 2;

async function retried_save(entity, kind, tries = MAX_TRIES, backoff = INITIAL_BACKOFF) {
	for (let attempt = 1; attempt <= tries; attempt++) {
		try {
			await save(entity, kind);
			return true;
		} catch (err) {
			// const isRetryable = err.code === 4 || err.code === 10 || err.code === "ETIMEDOUT"; // 4 = DEADLINE_EXCEEDED, 10 = ABORTED

			if (attempt === tries) {
				// || !isRetryable) {
				console.error(`Save failed after ${attempt} attempts`, err);
				throw err;
			}

			const delay = Math.min(backoff * Math.pow(BACKOFF_MULTIPLIER, attempt - 1), 20 * 60 * 1000);
			console.warn(`Save failed (attempt ${attempt}), retrying in ${delay}ms...`);
			await new Promise((res) => setTimeout(res, delay));
		}
	}
	return false;
}

async function save(entity, kind) {
	if (entity.updated) entity.updated = new Date();
	await db.collection(kind || get_kind(entity)).replaceOne({ _id: entity._id }, entity, { upsert: true });
	return true;
}

async function insert(entity, kind, id) {
	if (entity.updated) entity.updated = new Date();
	await db.collection(kind || get_kind(entity)).insertOne(entity);
	return true;
}

async function remove(entity) {
	if (!get_id(entity)) throw "no_id";
	await db.collection(get_kind(entity)).deleteOne({ _id: get_id(entity) });
	return true;
}

async function get_by_id(id) {
	return await get(get_kind_from_id(id), id);
}
