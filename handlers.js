app.all("/api/:method", handle_api_call);

app.all("/x/defer", async (req, res, next) => {
	if (!keys.defer_key) {
		return res.status(403).send("Forbidden");
	}
	var ip = req.socket.remoteAddress;
	if (ip !== "127.0.0.1" && ip !== "::1" && ip !== "::ffff:127.0.0.1") {
		return res.status(403).send("Forbidden");
	}
	if (req.query.key !== keys.defer_key) {
		return res.status(403).send("Forbidden");
	}
	var rq = req.query;
	console.log(rq);
	console.log(rq.f);
	var result = eval(rq.f)(rq.a, rq.b, rq.c, rq.d, rq.e);
	if (result && result.then) await result;
	res.status(200).set("Content-Type", "text/plain").send("Done!").end();
});

function test(a) {
	console.error("test(): " + a);
}

function send_json(res, json) {
	console.log(json);
	if (res.infs && res.infs.length) json.infs = res.infs;
	return res.status(200).set("Content-Type", "application/json").send(json).end();
}

async function handle_api_call(req, res, next) {
	var method = req.params.method,
		query = req.query;
	var args = { req: req, res: res };
	res.infs = [];
	if (req.method == "POST") query = req.body;
	console.log([method, query]);
	if (!REF[method])
		return send_json(res, {
			failed: true,
			reason: "invalid_call",
			name: method,
		});
	if (query.F)
		return send_json(res, {
			failed: true,
			reason: "invalid_field",
			field: "F",
		});
	if (REF[method].P && req.method != "POST")
		return send_json(res, {
			failed: true,
			reason: "invalid_method",
			method: req.method,
			needed: "POST",
		});
	if (REF[method].U) {
		var user = await get_user(req);
		if (!user)
			return send_json(res, {
				failed: true,
				reason: "not_logged_in",
				method: req.method,
			});
		args.user = user;
	}
	var keys = Object.keys(query);
	for (var i = 0; i < keys.length; i++) {
		var q = keys[i];
		if (!REF[method][q])
			return send_json(res, {
				failed: true,
				reason: "invalid_field",
				field: q,
			});
		if (REF[method][q].type == "string") {
			query[q] = "" + query[q];
			if (REF[method][q].length && query[q].length != REF[method][q].length)
				return send_json(res, {
					failed: true,
					reason: "invalid_field",
					field: q,
					exact_length: REF[method][q].length,
				});
			if (REF[method][q].minimum && query[q].length < REF[method][q].minimum)
				return send_json(res, {
					failed: true,
					reason: "invalid_field",
					field: q,
					minimum_length: REF[method][q].minimum,
				});
		}
		if (REF[method][q].type == "email") {
			query[q] = "" + query[q];
			try {
				query[q] = purify_email(query[q]);
			} catch (e) {
				return send_json(res, {
					failed: true,
					reason: "invalid_field",
					field: q,
					not_email: true,
				});
			}
		}
		if (REF[method][q].type == "boolean" && query[q] !== true && query[q] !== false)
			return send_json(res, {
				failed: true,
				reason: "invalid_field",
				field: q,
				must_be: "boolean",
			});
		if (REF[method][q].type == "number" && isNaN(query[q]))
			return send_json(res, {
				failed: true,
				reason: "invalid_field",
				field: q,
				must_be: "number",
			});
		if (REF[method][q].positive && !(query[q] > 0))
			return send_json(res, {
				failed: true,
				reason: "invalid_field",
				field: q,
				must_be: "positive",
			});
	}
	for (var q in REF[method]) {
		if (["U", "F", "P"].includes(q)) continue;
		if (!REF[method][q].optional && query[q] === undefined)
			return send_json(res, {
				failed: true,
				reason: "missing_field",
				field: q,
			});
	}
	Object.assign(query, args);
	try {
		var result = await REF[method].F(query);
		return send_json(res, result);
	} catch (e) {
		console.error(e);
		return send_json(res, { failed: true, reason: "exception" });
	}
}
