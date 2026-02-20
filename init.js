var Place = "backend";
var Engine = process.env.Engine || "mongodb";
var Project = process.env.GOOGLE_CLOUD_PROJECT || "";
var Local = (!process.env.GAE_APPLICATION && true) || false;
var Prod = Project.indexOf("-dev") == -1;
var Staging = !Local && !Prod;
var Dev = !Prod;
var Location =
	process.env.REGION ||
	((Dev || (process.env.GAE_APPLICATION && process.env.GAE_APPLICATION.indexOf("e~") != -1)) && "europe-west1") ||
	"us-central1";

function reinit_from_options() {
	Project = options.project_name;
	Dev = options.Dev;
	Local = options.Local;
	Prod = options.Prod;
	Staging = options.Staging;
	Location = "x";
}

async function get_domain_common(req) {
	return {
		libs: {
			cookie: "2.2.1",
			jquery: "3.5.1",
			socketio: "4.0.0",
			codemirror: "5.59.1",
			pixi: "6.0.0",
			pixi_filters: "4.1.3", // https://github.com/pixijs/filters/releases
			pixi_graphics_extras: "6.0.4",
			range_slider: "2.3.0",
			howler: "2.2.1",
			interact: "1.10.11",
			nunjucks: "3.2.2",
		},
		local: {
			// Local library versions
		},
		Dev: Dev,
		Local: Local,
		Staging: Staging,
		Prod: Prod,
	};
}

var argon2 = require("argon2");

var express = require("express"),
	app = express(),
	cookieParser = require("cookie-parser"),
	bodyParser = require("body-parser"),
	fetch = require("node-fetch");
var rawBodySaver = function (req, res, buf, encoding) {
	if (buf && buf.length) {
		try {
			try {
				// console.log(""+buf);
				req.rawBody = buf.toString(encoding || "utf8");
				req.query = JSON.parse(req.rawBody);
			} catch (e) {
				req.rawBody = "" + Buffer.from("" + buf, "base64");
				req.query = JSON.parse(req.rawBody);
			}
		} catch (e) {
			console.error("#R: " + e);
		}
	}
};

app.enable("trust proxy");
if (Dev)
	app.use((req, res, next) => {
		console.log(req.protocol + "://" + req.get("host") + req.originalUrl);
		next();
	});
if (Dev || 1) app.use(express.static("./", { maxAge: "30d" }));
if (Dev || 1) app.use(express.static("./common", { maxAge: "30d" }));
// no-store for dynamic routes (express.static short-circuits before this for static files)
app.use(function (req, res, next) {
	res.set("Cache-Control", "no-store");
	next();
});
if (Local || Staging) app.use(require("nocache")());

app.use(express.json({ extended: true, limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());
app.use(
	bodyParser.raw({
		verify: rawBodySaver,
		type: function () {
			return true;
		},
	}),
);

if (Engine == "appengine") {
	Datastore = require("@google-cloud/datastore").Datastore;
	datastore = new Datastore();
	K = datastore.KEY; // Doesn't work for some reason, even though everything is var
	CloudTasksClient = require("@google-cloud/tasks").CloudTasksClient;
	tasks = new CloudTasksClient();
} else if (Engine == "mongodb") {
	MongoClient = require("mongodb").MongoClient;
	client = new MongoClient(
		"mongodb://" +
			keys.mongodb_user +
			":" +
			keys.mongodb_password +
			"@" +
			keys.mongodb_ip +
			":" +
			keys.mongodb_port +
			"/" +
			keys.mongodb_name +
			"?authSource=" +
			keys.mongodb_auth_source,
		{
			tls: true,
			tlsCAFile: keys.mongodb_ca_file,
		},
	);
	client.connect();
	db = client.db(keys.mongodb_name);
}

var nunjucks = require("nunjucks");
// Configure nunjucks with the project root as base
// nunjucks.configure([require("path").join(__dirname, "..")], {});
var env = null;

if (Dev || 1)
	env = nunjucks.configure(["./common/", ".", "./templates"], {
		autoescape: true,
	});
else env = nunjucks.configure([".", "./templates"], { autoescape: true });

env.addFilter("key", function (e) {
	if (Engine == "mongodb") return e._id;
	else return e[datastore.KEY].name;
});

env.addFilter("to_json", function (obj) {
	return JSON.stringify(obj);
});
