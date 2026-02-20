function hide_modal(force) {
	var old_url = null,
		new_url = null;
	if (
		!force &&
		$(
			'.modal:last input.mprotected[type="text"], .modal:last input.mprotected[type="email"], .modal:last input.mprotected[type="password"], .modal:last textarea.mprotected',
		).filter(function () {
			return this.value.length > 0;
		}).length
	) {
		return show_confirm("Are you sure you want to discard your entries?", "Yes", "No!", function () {
			hide_modal();
			hide_modal(true);
		});
	}
	old_url = modals[modal_count - 1] && modals[modal_count - 1].url;
	if (modal_count > 0) modal_count--;
	new_url = modals[modal_count - 1] && modals[modal_count - 1].url;

	if (window.page && (old_url || new_url)) window.history.replaceState({}, page.title, new_url || page.url);

	if ($(".modal:last").find(".destroy").length) eval($(".modal:last").find(".destroy").attr("onclick"));

	$(".modal:last").remove();
	if ($(".modal:last").hasClass("hideinbackground")) {
		$(".modal:last").show();
		position_modals();
	}
	if (!modal_count) {
		$(".showwithmodals").hide();
		$(".hidewithmodals").show();
	}
}

function hide_modals() {
	while (modal_count) hide_modal(true);
}

var modals = [],
	modal_count = 0;
function show_modal(mhtml, args) {
	if (window.is_bot) return;
	if (!args) args = {};
	if (!args.opacity && window.modal_opacity !== undefined) args.opacity = window.modal_opacity;
	else if (!args.opacity) args.opacity = 0.4;
	if (!args.classes) args.classes = "";
	if (args.hideinbackground) args.classes = "hideinbackground";
	if (args.wrap === undefined) args.wrap = true;
	var wrap_styles = "",
		min_width = 600;
	min_width = min(600, $(window).width() - 32);
	if (args.wrap)
		wrap_styles =
			"width: " + (args.wwidth || min_width) + "px; border: 5px solid gray; border-radius: 5px; background: black;";
	modals[modal_count] = args;
	modal_count++;

	var html = "",
		styles = "";
	styles +=
		"position: fixed; top: 0px; bottom: 0px; left: 0px; right: 0px; z-index: 9000; text-align: center; vertical-align: middle; overflow-y: scroll; ";
	styles += "background: rgba(0,0,0," + args.opacity + ")";
	html +=
		"<div style='" +
		styles +
		"' class='modal " +
		args.classes +
		"' onclick='if(stprlink(event)) return; hide_modal()'>"; //-> .modal is referenced at payments.js
	html +=
		"<div style='display: inline-block; margin-bottom: 100px; margin-top: 40px; padding: 10px; text-align: left; position: relative; " +
		wrap_styles +
		" " +
		(args.styles || "") +
		"'";
	html += " onclick='stprlink(event); /*return false*/' class='imodal'>"; // commented out "return false" for the Guide links
	html += mhtml;
	if (args.ondestroy) html += '<div style="display:none" class="destroy" onclick="' + args.ondestroy + '"></div>';
	html += "</div>";
	html += "</div>";

	if ($(".modal:last").hasClass("hideinbackground")) $(".modal:last").hide();
	$("body").append(html);

	var height = $(window).height();
	var iheight = $(".imodal:last").height();
	if (height > iheight)
		$(".imodal:last")
			.css("margin-bottom", "0px")
			.css("margin-top", max(0, round(height / 2 - iheight / 2 - 5)));

	if ($(".modal:last").find(".oncreate").length) eval($(".modal:last").find(".oncreate").attr("onclick"));

	$(".showwithmodals").show();
	$(".hidewithmodals").hide();
	if (window.page && args.url) window.history.replaceState({}, page.title, args.url);
}

function show_alert(x) {
	show_modal(
		"<div style='padding: 20px; text-align:center'><pre style='font-family: Pixel; font-size: 48px;'>" +
			x +
			"</pre></div>",
	);
}

function position_modals() {
	$(".imodal").each(function () {
		var height = $(window).height();
		var $this = $(this),
			iheight = $this.height();
		if (height > iheight)
			$this.css("margin-bottom", "0px").css("margin-top", max(0, round(height / 2 - iheight / 2 - 5)));
		else $this.css("margin-bottom", "40px").css("margin-top", "100px");
	});
}

function show_confirm(q, yes, no, onclick) {
	return get_input({ title: q, button: yes, onclick: onclick });
}

var input_onclicks = [];
function get_input(args) {
	if (!args) return;
	var html =
			"<div style='" +
			((!args.no_wrap && "border: 5px solid gray; border-radius: 5px; padding: 5px; background: black") || "") +
			"'>",
		ilast = 0,
		focus = null;
	if (is_array(args)) args = { elements: args };
	else if (!args.elements) args = { elements: [args] };
	args.elements.forEach(function (element) {
		if (element.title) html += "<div class='textheader'>" + element.title + "</div>";
		if (element.input) {
			if (!focus) focus = element.input;
			html +=
				"<div style='margin-bottom: 4px'><input type='text' class='selectioninput mprotected " +
				element.input +
				"' placeholder='" +
				(element.placeholder || "") +
				"' value='" +
				(element.value || "") +
				"' style='" +
				(element.style || "") +
				"'/></div>";
		}
		if (element.textarea) {
			if (!focus) focus = element.textarea;
			html +=
				"<div style='margin-bottom: 4px'><textarea class='selectiontextarea mprotected " +
				element.textarea +
				"' placeholder='" +
				(element.placeholder || "") +
				"' value='" +
				(element.value || "") +
				"' style='" +
				(element.style || "") +
				"'/></div>";
		}
		if (element.button) {
			input_onclicks[ilast++] = element.onclick;
			html +=
				"<div class='button " +
				((element.small && "button-small mb2") || "mb5") +
				"' onclick='smart_eval(input_onclicks[" +
				(ilast - 1) +
				"])' style='display:block'>" +
				element.button +
				"</div>";
		}
	});
	html += "</div>";
	show_modal(html, { wrap: false });
	if (focus) $("." + focus).focus();
}

function stprlink(event) {
	// to make modal click catchers let <a> clicks pass, for electron logic [05/02/19]
	try {
		if (event.target.tagName.toLowerCase() === "a") return true;
		event.stopPropagation();
	} catch (e) {}
	return false;
}

jQuery.fn.rval = function (r) {
	var e = jQuery(this);
	var val = e.val();
	if (r == undefined) r = "";
	e.val(r);
	return val;
};
