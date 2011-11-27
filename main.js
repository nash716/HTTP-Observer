const statusIcon = '<span class="sent">●</span>';
const request = '<b><span class="r">Request Headers</span></b>: <br />';
const response = '<b><span class="r">Response Headers</span></b>: <br />';
const statusline = '<b><span class="r">Status Line</span></b>: <br />';

const ext_version = 0.05;
var isCapture = true;

$(document).ready(function() {
	if (ext_version < version) {
		$('div#header hr').before(' | <a href="javascript:chrome.tabs.create({url:\'' + download + '\', selected:true});">New version available!</a>');
	}
});

chrome.experimental.webRequest.onSendHeaders.addListener(onSendHeaders, { }, ['requestHeaders']);

chrome.experimental.webRequest.onCompleted.addListener(function(details) {
	if (isCapture && !$('div#' + details.requestId)) {
		return;
	}
	if (isCapture) {
		var addCls;
		if (details.statusLine.match('404') || details.statusLine.match('400') || details.statusLine.match('403') || details.statusLine.match('405') || details.statusLine.match('406') || details.statusLine.match('401') || details.statusLine.match('500') || details.statusLine.match('502') || details.statusLine.match('503') || details.statusLine.match('504')) {
			addCls = 'error';
		} else {
			addCls = 'ok';
		}
		$('div#' + details.requestId).children('span.sent')
							.removeClass('sent')
							.addClass(addCls); // TODO
		
		var str = $('div#' + details.requestId).next().html();
		str = statusline + details.statusLine + '<br />' + str;
		str += response;
		
		for (var key in details.responseHeaders) {
			str += '<b>' + text(details.responseHeaders[key].name) + '</b>: ' + text(details.responseHeaders[key].value) + '<br />';
		}
		
		$('div#' + details.requestId).next().html(str);
	}
}, { }, ['statusLine', 'responseHeaders']);

chrome.experimental.webRequest.onErrorOccurred.addListener(function(details) {
	if (isCapture && !$('div#' + details.requestId)) {
		return;
	}
	if (isCapture) {
		$('div#' + details.requestId).children('span.sent')
							.removeClass('sent')
							.addClass('error');
		var str = $('div#' + details.requestId).next().html();
		str += '<br /><b><span class="error r">Error:</span></b><br />' + details.error;
		$('div#' + details.requestId).next().html(str);
	}
}, { });

function text(str) {
	str = str.split('&').join('&amp;'); //.replace('&', '&amp;');
	str = str.split('"').join('&quot;'); //.replace('"', '&quot;');
	str = str.split('<').join('&lt;'); //.replace('<', '&lt;');
	str = str.split('>').join('&gt;'); //.replace('>', '&gt;');
	str = str.split("'").join('&#039;'); //.replace("'", '&#039;');
	return str;
}

function onSendHeaders(details) {
	if (isCapture) {
		var str = '';
		for (var key in details.requestHeaders) {
			str += '<b>' + text(details.requestHeaders[key].name) + '</b>: ' + text(details.requestHeaders[key].value) + '<br />';
		}
		$('<div>').html(statusIcon + text(details.url))
				.addClass('caption')
				.attr('id', details.requestId)
				.click(function() {
					$(this).next().toggle();
				}).appendTo($('div#content'));//$(document.body));
				
		$('<div>').html(request + str)
				.addClass('detail')
				.css('display', 'none')
				.appendTo($('div#content'));//$(document.body));
		if ($('#as').attr('checked')) {
			_scroll($(document).height(), 0);
		}
	}
}

function _scroll(height, duration) {
	$(document.body).animate({scrollTop:height}, duration);
}