var G = {};

function api_call(method, args, r_args) {
	if (!args) args = {};
	if (!r_args) r_args = {};
	if (r_args.disable) r_args.disable.addClass("disable");
	var P = new deferred();
	var call_args = { 
		method: "POST", 
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		url: "/api/" + method, 
		data: JSON.stringify(args)
	};
	$.ajax(call_args)
		.done(function (data, textStatus, jqXHR) {
			var infs = data.infs;
			if (infs) delete data.infs;
			if (data && !data.failed) P.resolve(data);
			else P.reject(data);
			if (r_args.disable) r_args.disable.removeClass("disable");
			if (infs) handle_information(infs);
		})
		.fail(function (jqXHR, textStatus, errorThrown) {
			var infs = data.infs;
			if (infs) delete data.infs;
			P.reject({ failed: true, error: errorThrown });
			if (r_args.disable) r_args.disable.removeClass("disable");
			if (infs) handle_information(infs);
		});
	return P.promise;
}

function deferred() {
	var self = this;
	this.promise = new Promise(function (resolve, reject) {
		self.reject = reject;
		self.resolve = resolve;
	});
}

function random_string(len, type) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",
		schars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",
		str = "";
	if (type == 1) chars = "0123456789abcdefghiklmnopqrstuvwxyz";
	for (var i = 0; i < len; i++) {
		if (i == 0 && type === 0) {
			var rnum = floor(random() * schars.length);
			str += schars.substring(rnum, rnum + 1);
		} else {
			var rnum = floor(random() * chars.length);
			str += chars.substring(rnum, rnum + 1);
		}
	}
	return str;
}

function hx(color) {
	return eval("0x" + color.replace("#", ""));
}

function round(n) {
	return Math.round(n);
}

function sqrt(n) {
	return Math.sqrt(n);
}

function floor(n) {
	return Math.floor(n);
}

function ceil(n) {
	return Math.ceil(n);
}

function min(a, b) {
	return Math.min(a, b);
}

function max(a, b) {
	return Math.max(a, b);
}

function random() {
	return Math.random();
}

function random_number(mx) {
	return floor(random() * mx);
}

function K(a) {
	return Object.keys(a);
}

function future_ms(ms) {
	var c = new Date();
	c.setUTCMilliseconds(c.getUTCMilliseconds() + ms);
	return c;
}
function future_s(s) {
	return future_ms(s * 1000);
}
function future_m(s) {
	return future_ms(s * 60000);
}
function future_h(s) {
	return future_ms(s * 3600000);
}
function future_d(s) {
	return future_ms(s * 3600000 * 24);
}
function ms_since(t, ref) {
	if (!ref) ref = new Date();
	if (!t.getTime) t = new Date(t);
	if (!ref.getTime) ref = new Date(t);
	return ref.getTime() - t.getTime(); // .getTime() is always UTC
}
function s_since(t, ref) {
	return ms_since(t, ref) / 1000.0;
}
function m_since(t, ref) {
	return ms_since(t, ref) / 60000.0;
}
function h_since(t, ref) {
	return ms_since(t, ref) / 3600000.0;
}

function html_escape(html) {
	var escaped = "" + html;
	var findReplace = [
		[/&/g, "&amp;"],
		[/</g, "&lt;"],
		[/>/g, "&gt;"],
		[/"/g, "&quot;"],
	];
	for (var item in findReplace) escaped = escaped.replace(findReplace[item][0], findReplace[item][1]);
	return escaped;
}

String.prototype.toTitleCase = function () {
	return this.replace(/\w\S*/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
};

String.prototype.replace_all = function (find, replace) {
	var str = this;
	return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"), replace);
};

Object.defineProperty(String.prototype, "hashCode", {
	value: function () {
		var hash = 0,
			i,
			chr;
		for (i = 0; i < this.length; i++) {
			chr = this.charCodeAt(i);
			hash = (hash << 5) - hash + chr;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
	},
});

function trigger(f) {
	setTimeout(f, 0);
}

function to_pretty_num(num) {
	if (!num) return 0;
	let pretty = "",
		prefix = "";
	if (num < 0) {
		prefix = "-";
		num = -num;
	}
	num = Math.floor(num);
	while (num) {
		let current = num % 1000;
		if (!current) {
			current = "000";
		} else if (current < 10 && current !== num) {
			current = `00${current}`;
		} else if (current < 100 && current !== num) {
			current = `0${current}`;
		}
		pretty = pretty ? `${current},${pretty}` : `${current}`;
		num = Math.floor(num / 1000);
	}
	return `${prefix}${pretty}`;
}

function to_number(num) {
	try {
		num = round(parseInt(num));
		if (num < 0) return 0;
		if (!num) num = 0;
	} catch (e) {
		num = 0;
	}
	return num;
}

function is_nun(a) {
	if (a === undefined || a === null) return true;
	return false;
}

function nunv(a, b) {
	if (a === undefined || a === null) return b;
	return a;
}

function is_int(obj) {
	try {
		if (Number.isInteger(obj)) return true;
	} catch (e) {}
	return false;
}

function is_number(obj) {
	try {
		if (!isNaN(obj) && 0 + obj === obj) return true;
	} catch (e) {}
	return false;
}

function is_string(obj) {
	try {
		return Object.prototype.toString.call(obj) == "[object String]";
	} catch (e) {}
	return false;
}

function is_array(a) {
	try {
		if (Array.isArray(a)) return true;
	} catch (e) {}
	return false;
}

function is_function(f) {
	try {
		var g = {};
		return f && g.toString.call(f) === "[object Function]";
	} catch (e) {}
	return false;
}

function is_object(o) {
	try {
		return o !== null && typeof o === "object";
	} catch (e) {}
	return false;
}

function clone(obj, args) {
	// http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
	if (!args) args = {};
	if (!args.seen && args.seen !== []) args.seen = []; // seen modification - manual [24/12/14]
	if (null == obj) return obj;
	if (args.simple_functions && is_function(obj)) return "[clone]:" + obj.toString().substring(0, 40);
	if ("object" != typeof obj) return obj;
	if (obj instanceof Date) {
		var copy = new Date();
		copy.setTime(obj.getTime());
		return copy;
	}
	if (obj instanceof Array) {
		args.seen.push(obj);
		var copy = [];
		for (var i = 0; i < obj.length; i++) {
			copy[i] = clone(obj[i], args);
		}
		return copy;
	}
	if (obj instanceof Object) {
		args.seen.push(obj);
		var copy = {};
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) {
				if (args.seen.indexOf(obj[attr]) !== -1) {
					copy[attr] = "circular_attribute[clone]";
					continue;
				}
				copy[attr] = clone(obj[attr], args);
			}
		}
		return copy;
	}
	throw "type not supported";
}

function safe_stringify(obj, third) {
	// doesn't work for Event's - clone also doesn't work [31/08/15]
	var seen = [];
	try {
		if (obj === undefined) return "undefined";
		var result = JSON.stringify(
			obj,
			function (key, val) {
				if (val != null && typeof val == "object") {
					if (seen.indexOf(val) >= 0) {
						return;
					}
					seen.push(val);
					if ("x" in val) {
						// amplify - also in functions.js game_stringify
						var new_val = {};
						["x", "y", "width", "height"].forEach(function (p) {
							if (p in val) new_val[p] = val[p];
						});
						for (var p in val) new_val[p] = val[p];
						val = new_val;
					}
				}
				return val;
			},
			third,
		);
		try {
			if ("x" in obj) {
				// amplify - also in functions.js game_stringify
				result = JSON.parse(result);
				result.x = obj.x;
				result.y = obj.y;
				result = JSON.stringify(result);
			}
		} catch (e) {}
		return result;
	} catch (e) {
		return "safe_stringify_exception";
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function smart_eval(code, args) {
	// window[cur.func] usages might execute the corresponding string and cause an exception - highly unlikely [22:32]
	if (!code) return;
	if (args && !is_array(args)) args = [args];
	if (is_function(code)) {
		if (args) code.apply(this, clone(args));
		// if args are not cloned they persist and cause irregularities like mid persistence [02/08/14]
		else code();
	} else if (is_string(code)) eval(code);
}

function is_substr(a, b) {
	if (is_array(b)) {
		for (var i = 0; i < b.length; i++) {
			try {
				if (a && a.toLowerCase().indexOf(b[i].toLowerCase()) != -1) return true;
			} catch (e) {}
		}
	} else {
		try {
			if (a && a.toLowerCase().indexOf(b.toLowerCase()) != -1) return true;
		} catch (e) {}
	}
	return false;
}

function html_escape(html) {
	var escaped = "" + html;
	var findReplace = [
		[/&/g, "&amp;"],
		[/</g, "&lt;"],
		[/>/g, "&gt;"],
		[/"/g, "&quot;"],
	];
	for (var item in findReplace) escaped = escaped.replace(findReplace[item][0], findReplace[item][1]);
	return escaped;
}

function strip_string(str) {
	var regexSymbolWithCombiningMarks =
		/([\0-\u02FF\u0370-\u1AAF\u1B00-\u1DBF\u1E00-\u20CF\u2100-\uD7FF\uE000-\uFE1F\uFE30-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])([\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]+)/g;
	var regexLineBreakCombiningMarks =
		/[\0-\x08\x0E-\x1F\x7F-\x84\x86-\x9F\u0300-\u034E\u0350-\u035B\u0363-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u061C\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D4-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D01-\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F7E\u0F80-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF5\u1DFB-\u1DFF\u200C\u200E\u200F\u202A-\u202E\u2066-\u206F\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3035\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFFF9-\uFFFB]|\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD804[\uDC00-\uDC02\uDC38-\uDC46\uDC7F-\uDC82\uDCB0-\uDCBA\uDD00-\uDD02\uDD27-\uDD34\uDD73\uDD80-\uDD82\uDDB3-\uDDC0\uDDCA-\uDDCC\uDE2C-\uDE37\uDE3E\uDEDF-\uDEEA\uDF00-\uDF03\uDF3C\uDF3E-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC35-\uDC46\uDCB0-\uDCC3\uDDAF-\uDDB5\uDDB8-\uDDC0\uDDDC\uDDDD\uDE30-\uDE40\uDEAB-\uDEB7]|\uD807[\uDC2F-\uDC36\uDC38-\uDC3F\uDC92-\uDCA7\uDCA9-\uDCB6]|\uD81A[\uDEF0-\uDEF4\uDF30-\uDF36]|\uD81B[\uDF51-\uDF7E\uDF8F-\uDF92]|\uD82F[\uDC9D\uDC9E\uDCA0-\uDCA3]|\uD834[\uDD65-\uDD69\uDD6D-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDCD0-\uDCD6\uDD44-\uDD4A]|\uDB40[\uDC01\uDC20-\uDC7F\uDD00-\uDDEF]/g;
	// https://github.com/mathiasbynens/strip-combining-marks/blob/master/strip-combining-marks.js
	return str
		.replace(regexLineBreakCombiningMarks, "")
		.replace(regexSymbolWithCombiningMarks, "$1")
		.replace(/[^\p{L}\p{N}\p{S}\p{P}\p{Z}]/gu, ""); // https://stackoverflow.com/a/63464318/914546
}

function purify_email(email, check = true) {
	// Remove spaces, tabs, newlines, carriage returns
	email = email.replace(/\s/g, "").toLowerCase();

	if (check && !isEmailValid(email)) {
		throw new Error("Invalid email format.");
	}

	const parts = email.split("@");
	if (parts.length !== 2) {
		throw new Error('Email must contain a single "@" symbol.');
	}

	let [name, domain] = parts;

	if (check) {
		const domainParts = domain.split(".");
		if (domainParts.length < 2 || domainParts[1].length < 2) {
			throw new Error("Invalid domain in email address.");
		}
	}

	if (domain === "gmail.com" || domain === "googlemail.com") {
		domain = "gmail.com";
		name = name.replace(/\./g, "");
		email = `${name}@${domain}`;
	}

	console.info(`purifyEmail ${email}`);
	return email;
}

function isEmailValid(email) {
	// Simple regex for basic email validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}
