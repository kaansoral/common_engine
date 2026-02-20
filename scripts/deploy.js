var f = require(process.env.HOME + "/common/scripts/script_functions.js");
var project = process.argv[2];
var project_folder = "~/" + project;

// f.execs("node ~/common/scripts/precompute.js")

f.execs("rm -rf ~/deploy/" + project);
f.execs("mkdir ~/deploy/" + project);

f.execs("cp -r " + project_folder + "/* ~/deploy/" + project);
f.execs("cp -r " + project_folder + "/.gcloudignore ~/deploy/" + project);
f.execs("cp -r ~/common/* ~/deploy/" + project);
// f.execs("rsync -rv --exclude=.electron ~/"+project+"/* ~/deploy/"+project+");

["node", "server", "scripts", "stack", "electron"].forEach(function (folder) {
	f.execs("rm -rf ~/deploy/" + project + "/" + folder);
});
f.execs("find ~/deploy/" + project + "/ -name '*.pxm' -delete");

to_minify = {
	js: ["common_functions.js", "client_functions.js"],
	css: ["main.css", "index.css", "common.css"],
};

f.minify_all("~/deploy/" + project, to_minify);
