function is_admin(user) {
	if (Dev) return true;
	if (user && user.admin) return true;
	return false;
}

app.get("/admin/executor", async (req, res, next) => {
	var user = await get_user(req),
		domain = await get_domain(req, user);
	if (!is_admin(user)) return res.status(200).set("Content-Type", "text/plain").send("No Auth").end();
	domain.title = "Executor";
	return res
		.status(200)
		.send(nunjucks.render("htmls/admin_executor.html", { domain: domain, admin: true }))
		.end();
});

app.get("/admin/renderer", async (req, res, next) => {
	var user = await get_user(req),
		domain = await get_domain(req, user);
	if (!is_admin(user)) return res.status(200).set("Content-Type", "text/plain").send("No Auth").end();
	domain.title = "Renderer";
	return res
		.status(200)
		.send(nunjucks.render("htmls/admin_renderer.html", { domain: domain, admin: true }))
		.end();
});

app.get("/admin/make/user/admin", async (req, res, next) => {
	if (!Dev) return;
	var user = await get_user(req);
	if (user) {
		user.admin = true;
		await save(user);
		return res.status(200).set("Content-Type", "text/plain").send("Done!").end();
	}
	return res.status(200).set("Content-Type", "text/plain").send("No User!").end();
});

async function execute_api(args) {
	var W = await get_user(args.req);
	if (!is_admin(W)) return { failed: true };
	var req = args.req,
		output = undefined,
		inspect = null,
		logs = "",
		error = error;
	var console = {
		log: function (s) {
			logs += s + "<br />";
		},
		error: function (s) {
			logs += "[ERR]: " + s + "<br />";
		},
	};
	try {
		await eval("(async () => {" + args.code + "})()");
	} catch (e) {
		global["console"].error(e);
		error = "" + e;
	}
	try {
		if (inspect) JSON.stringify(inspect);
	} catch (e) {
		inspect = "STRINGIFICATION FAILED";
	}
	var response = { success: true, inspect: inspect, logs: logs, error: error };
	if (output !== undefined) response.output = output;
	return response;
}

REF.execute = {
	F: execute_api,
	P: true,
	code: { type: "string" },
};
