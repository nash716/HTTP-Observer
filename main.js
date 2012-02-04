/* TODO
 * onTabsChangedの実装が雑なのでそのうち直す
 * $('#list').children().hide()あたりの実装が非常によろしくない感じ
*/

const statusIcon = '<span class="sent">●</span>';
const request = '<b><span class="r">Request Headers</span></b>: <br />';
const response = '<b><span class="r">Response Headers</span></b>: <br />';
const statusline = '<b><span class="r">Status Line</span></b>: <br />';

const ext_version = 0.2;
var isCapture = true;
var captureTarget = 'all';

$(document).ready(function() {
	setTimeout(function() {
		$('div#list').css('height', $(document).height() - 65 + 'px');
		$('div#content').css('height', $(document).height() - 65 + 'px');
	}, 100);
	
	if (ext_version < version) {
		$('div#header hr').before(' | <a href="javascript:chrome.tabs.create({url:\'' + download + '\', selected:true});">New version available!</a>');
	}
	
	$('<option>').attr('value', 'all')
			.html('All')
			.appendTo($('#target'));
	
	chrome.windows.getAll({ populate: true } , function(windows) {
		for (var i=0; i<windows.length; i++) {
			var tabs = windows[i].tabs;
			for (var j=0; j<tabs.length; j++) {
				$('<option>').attr('value', tabs[j].id)
						.html(text(tabs[j].title))
						.appendTo($('#target'));
			}
		}
	});
	
	$('#target').change(function() {
		captureTarget = $('#target option:checked').attr('value');
	});
});

chrome.experimental.webRequest.onSendHeaders.addListener(onSendHeaders, { }, ['requestHeaders']);

chrome.experimental.webRequest.onCompleted.addListener(onCompleted, { }, ['responseHeaders']);

chrome.experimental.webRequest.onErrorOccurred.addListener(onErrorOccurred, { });

chrome.tabs.onRemoved.addListener(onTabsChanged);

chrome.tabs.onCreated.addListener(onTabsChanged);

chrome.tabs.onUpdated.addListener(onTabsChanged);

function text(str) {
	str = str.split('&').join('&amp;'); //.replace('&', '&amp;');
	str = str.split('"').join('&quot;'); //.replace('"', '&quot;');
	str = str.split('<').join('&lt;'); //.replace('<', '&lt;');
	str = str.split('>').join('&gt;'); //.replace('>', '&gt;');
	str = str.split("'").join('&#039;'); //.replace("'", '&#039;');
	return str;
}

/* [TODO]
onBeforeRequest
onBeforeSendHeaders
onHeadersReceived
onAuthRequired
onBeforeRedirect
onResponseStarted
*/

function onErrorOccurred(details) {
	if (isCapture && !$('div#' + details.requestId)) {
		return;
	}
	if (isCapture) {
		$('div#' + details.requestId).children('span.sent')
							.removeClass('sent')
							.addClass('error');
		var str = $('div#' + details.requestId + 'content').html();
		str += '<br /><b><span class="error r">Error:</span></b><br />' + details.error;
		$('div#' + details.requestId + 'content').html(str);
	}
}

function onCompleted(details) {
	if (isCapture && !$('div#' + details.requestId + 'content')) {
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
		
		var str = $('div#' + details.requestId + 'content').html();
		str = statusline + details.statusLine + '<br />' + str;
		str += response;
		
		for (var key in details.responseHeaders) {
			str += '<b>' + text(details.responseHeaders[key].name) + '</b>: ' + text(details.responseHeaders[key].value) + '<br />';
		}
		
		$('div#' + details.requestId + 'content').html(str);
	}
}

function onSendHeaders(details) {
	if (!isCapture) return;
	if (captureTarget != 'all' && details.tabId != parseInt($('#target').val())) return;
	
	var str = '';
	for (var key in details.requestHeaders) {
		str += '<b>' + text(details.requestHeaders[key].name) + '</b>: ' + text(details.requestHeaders[key].value) + '<br />';
	}
	
	var parseURL = text(details.url).split('/');
	var fileName = parseURL[parseURL.length - 1] ? parseURL[parseURL.length - 1] : parseURL[parseURL.length - 2];
	delete parseURL[parseURL.length - 1];
	var pathName = parseURL.join('/');
	
	$('<div>').html(statusIcon + fileName + '<br /><span class="path">' + pathName + '</span>')
			.addClass('caption')
			.attr('id', details.requestId)
			.click(function() {
// いちいちDOM Element持ってるのはめんどくさいのでそのうち直す
				$('div#content').children().hide();
				$('div#' + $(this).attr('id') + 'content').toggle();
			}).appendTo($('div#list'));//$(document.body));
			
	$('<div>').html(request + str)
			.attr('id', details.requestId + 'content')
			.addClass('detail')
			.css('display', 'none')
			.appendTo($('div#content'));//$(document.body));

	if ($('#as').attr('checked')) {
		_scroll($('div#list').get(0).scrollHeight, 0);
	}
}

function onTabsChanged() {
// 一旦全部削除
	$('#target').children().remove();

// Allをつける
	$('<option>').attr('value', 'all')
		.html('All')
		.appendTo($('#target'));

// またoptionを付け直す（あとで直す）
	chrome.windows.getAll({ populate: true } , function(windows) {
		for (var i=0; i<windows.length; i++) {
			var tabs = windows[i].tabs;
			for (var j=0; j<tabs.length; j++) {
				$('<option>').attr('value', tabs[j].id)
						.html(text(tabs[j].title))
						.appendTo($('#target'));
			}
		}
// 変更前に選択したものが残っていればそれを選択状態にする
		if ($('#target option[value=' + captureTarget + ']').length == 1) {
			$('#target').val(captureTarget);
		} else {
			$('#target').val('all');
			captureTarget = 'all';
		}
	});
}

function _scroll(height, duration) {
	$('div#list').animate({ scrollTop : height }, duration);
}