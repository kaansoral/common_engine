function get_key(e) {
	return e[datastore.KEY];
}

function get_id(e) {
	return e[datastore.KEY].name;
}

function post_get(kind, entity) {
	if (entity) {
		if (models[kind] && models[kind].blobs)
			models[kind].blobs.forEach(function (p) {
				entity[p] = JSON.parse(entity[p].toString("utf8"));
			});
		if (models[kind] && models[kind].post) models[kind].post(entity);
	}
	return entity;
}

function post_process_query_results(kind, results) {
	results[0] &&
		results[0].forEach(function (entity) {
			post_get(kind, entity);
		});
}

async function transaction_get(transaction, kind, key) {
	var element = await transaction.get(datastore.key([to_model(kind), key]));
	// console.log(element);
	if (element && element[0]) return post_get(kind, element[0]);
	return null;
}

async function tx(F, A, tries = 1, backoff = INITIAL_BACKOFF) {
	var R = { failed: false, success: true };
	for (let attempt = 1; attempt <= tries; attempt++) {
		try {
			try {
				var transaction = datastore.transaction(),
					ex_reason = null,
					saves = [];
				function tx_save(entity, kind, key) {
					saves.push(to_datastore(entity, kind, key));
				}
				function ex(reason) {
					ex_reason = reason;
					throw ex_reason;
				}
				function tx_get(kind, key) {
					return transaction_get(transaction, kind, key);
				}
				await transaction.run();

				// console.log(F.toString());
				await eval("(" + F.toString() + ")();");

				await transaction.save(saves);
				await transaction.commit();

				return R;
			} catch (e) {
				if (!ex_reason) console.error(e);
				await transaction.rollback();
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

async function get(kind, key) {
	var element = await datastore.get(datastore.key([to_model(kind), key]));
	// console.log(element);
	if (element && element[0]) return post_get(kind, element[0]);
	return null;
}

async function fetch_all(kind) {
	var query = datastore.createQuery(to_model(kind));
	query = query.limit(8000);
	var results = await datastore.runQuery(query);
	// console.log(results);
	return results[0];
}

async function fetch_one(query) {
	query = query.limit(1);
	var results = await datastore.runQuery(query);
	if (results && results[0] && results[0].length) return results[0][0];
	return null;
}

function query(kind) {
	return datastore.createQuery(to_model(kind));
}

function to_model(kind) {
	return kind.toTitleCase();
}

function to_key(kind, id) {
	return datastore.key([to_model(kind), id]);
}

function to_kind(element) {
	return get_key(element).path[0].toLowerCase();
}

function a_rand(kind) {
	return (models[kind] && models[kind].a_rand && random_number(models[kind].a_rand)) || 0;
}

function to_datastore(entity, kind, id) {
	// kind,key optional
	var key = null;
	if (id) key = to_key(kind, id);
	else key = get_key(entity);
	if (!key) throw "no_key";
	if (!kind) kind = key.path[0].toLowerCase();
	var shadow = Object.assign({}, entity);
	((models[kind] && models[kind] && models[kind].blobs) || []).forEach(function (p) {
		if (!Buffer.isBuffer(entity[p])) shadow[p] = Buffer.from(JSON.stringify(entity[p]), "utf8");
	});
	var exclude = [];
	exclude.push(...((models[kind] && models[kind].exclude) || []));
	exclude.push(...((models[kind] && models[kind].blobs) || []));
	return {
		key: key,
		data: shadow,
		excludeFromIndexes: exclude,
	};
}

async function safe_save(entity, kind, id) {
	if (entity.updated) entity.updated = new Date();
	try {
		await datastore.save(to_datastore(entity, kind, id));
		return true;
	} catch (e) {}
	return false;
}

const MAX_TRIES = 5;
const INITIAL_BACKOFF = 1000; // milliseconds
const BACKOFF_MULTIPLIER = 2;

async function retried_save(entity, kind, id, tries = MAX_TRIES, backoff = INITIAL_BACKOFF) {
	if (entity.updated) entity.updated = new Date();

	for (let attempt = 1; attempt <= tries; attempt++) {
		try {
			await datastore.save(to_datastore(entity, kind, id));
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

async function save(entity, kind, id) {
	if (entity.updated) entity.updated = new Date();
	await datastore.save(to_datastore(entity, kind, id));
	return true;
}

async function upsert(entity, kind, id) {
	if (entity.updated) entity.updated = new Date();
	await datastore.upsert(to_datastore(entity, kind, id));
	return true;
}

async function remove(entity) {
	if (!get_key(entity)) throw "no_key";
	await datastore.delete(get_key(entity));
	return true;
}

async function get_by_iid(iid) {
	var kind = iid.split("|")[0],
		id = iid.split("|")[1];
	return await get(kind, id);
}

async function get_by_id(id) {
	if (id.startsWith("LT")) return await get("lottery", id);
	if (id.startsWith("RC")) return await get("wallet", id);
	if (id.startsWith("PZ")) return await get("puzzle", id);
	if (id.startsWith("TK")) return await get("ticket", id);
	if (id.startsWith("US")) return await get("user", id);
	if (id.startsWith("CH")) return await get("character", id);
	return null;
}

async function post_url(url, args) {
	var result = { failed: true };
	await fetch(url, {
		method: "post",
		body: JSON.stringify(args),
		headers: { "Content-Type": "application/json" },
	})
		.then((res) => res.json())
		.then((data) => {
			result = data;
		})
		.catch((err) => {
			result = { failed: true, error: err };
		});
	return result;
}

async function create_task(args) {
	args = args || {};
	let data = args.data || {};
	if (args.queue);
	else if (args.name) args.queue = queue = "queue" + (20 + (args.name.hashCode() % 42));
	else args.queue = "queue" + (20 + floor(random() * 42));
	const parent = tasks.queuePath(Project, Location, args.queue);
	const task = {
		appEngineHttpRequest: {
			httpMethod: "POST",
			relativeUri: args.url || "/test",
		},
	};
	if (args.name) {
		task.name = `projects/${Project}/locations/${Location}/queues/${args.queue}/tasks/${args.name}`;
	}
	task.appEngineHttpRequest.body = Buffer.from(JSON.stringify(data)).toString("base64");
	task.scheduleTime = { seconds: (args.seconds || 0) + Date.now() / 1000 };

	if (Dev && !args.live) {
		let P = args.P || new deferred();
		setTimeout(
			function () {
				fetch("http://rcoin.com" + task.appEngineHttpRequest.relativeUri, {
					timeout: 8000,
					method: "post",
					body: task.appEngineHttpRequest.body,
					headers: { "Content-Transfer-Encoding": "base64" }, // 'Content-Type': 'application/octet-stream; charset=base64',
					// rawBodySaver is the one that achieves this, not the above trials
				})
					.then((data) => {
						console.log("[CREATE_TASK_FETCH] Success!");
						P.resolve(data);
					})
					.catch((err) => {
						console.log("[CREATE_TASK_FETCH_ERROR] Retrying ... " + err);
						args.P = P;
						create_task(args);
					});
			},
			(args.seconds || 0) * 1000,
		);
		return P.promise;
	} else {
		const request = { parent, task };
		return tasks.createTask(request);
		//const [response]=await tasks.createTask(request);
		//const name=response.name;
		//console.log(`Created task ${name}`);
	}
}

function defer(seconds, f, a, b, c, d, e) {
	return create_task({
		seconds: seconds,
		data: { f: f, a: a, b: b, c: c, d: d, e: e },
		url: "/x/defer",
	});
}

function place_stop(main_key, sub_key, value, extra) {
	var key = "STOP_" + main_key + "_" + sub_key;
	var stop = {
		main_key: main_key,
		sub_key: sub_key,
		value: value,
		extra: extra,
		created: new Date(),
		a_rand: random_number(500),
	};
	return datastore.save({ key: datastore.key(["Stop", key]), data: stop });
}
