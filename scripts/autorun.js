var child_process = require("child_process"),
	fs = require("fs");
var Engine = "mongodb";
var folder = process.argv[2],
	project = process.argv[2];
var dir = "/Users/kaan/" + folder;
var options = require("/Users/kaan/" + folder + "/secretsandconfig/options");
var common = "/Users/kaan/common";

child_process.exec("kill -9 `ps aux | grep 'node .*--" + project + "' | grep -v grep | awk '{print $2}'`");

if (Engine == "appengine") {
	process.env.GOOGLE_CLOUD_PROJECT = project;
	process.env.GOOGLE_APPLICATION_CREDENTIALS = options.service_account_path;
	process.env.Engine = "appengine";
}
process.env.Dev = 1;
process.env.TZ = "UTC";

function execso(code) {
	try {
		output = child_process.execSync(code);
		if (output.toString) output = output.toString();
		console.log(output);
	} catch (e) {
		console.log("execso.Error: " + e);
	}
}

var node_sdk = null;
function rerun_node_sdk() {
	if (node_sdk) node_sdk.kill();
	node_sdk = child_process.spawn("node", [dir + "/main.js", "--" + project], {
		cwd: dir,
		env: process.env,
		stdio: "inherit",
	});
	node_sdk.on("spawn", () => {
		console.log("\x1b[35m[AUTORUN]\x1b[0m spawned the process [" + project + "]");
	});
	node_sdk.on("error", (err) => {
		console.error("\x1b[35m[AUTORUN]\x1b[0m Failed to spawn the process: " + err);
	});
	node_sdk.on("close", (code) => {
		console.log("\x1b[35m[AUTORUN]\x1b[0m process exited with code: " + code);
	});
}

function precompute() {
	execso("node " + dir + "/scripts/precompute_images.js");
	console.log("\x1b[34m[PRECOMPUTE IMAGES]\x1b[0m Done!");
}

function retemplate() {
	execso("cd " + dir + "; node " + dir + "/scripts/precompile_templates.js");
	console.log("\x1b[38;5;208m[AUTORUN]\x1b[0m Re-compiled templates");
}

retemplate();
setTimeout(function () {
	rerun_node_sdk();
	watcher1 = fs.watch(dir, { recursive: true }, function (event, fname) {
		if (fname.indexOf("templates.js") == -1 && fname.indexOf("version.js") == -1) rerun_node_sdk();
		if (fname.indexOf("sprites.js") != -1) precompute();
	});

	watcher2 = fs.watch(common, { recursive: true }, function (event, fname) {
		rerun_node_sdk();
	});

	watcher3 = fs.watch(dir + "/templates", { recursive: true }, function (event, fname) {
		retemplate();
	});
}, 200);

process.stdin.on("data", function (chunk) {
	if (chunk.indexOf("\n") != -1) rerun_node_sdk();
});
