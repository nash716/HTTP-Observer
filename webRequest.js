chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, filterObject);
chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, filterObject);
chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, filterObject);
chrome.webRequest.onSendHeaders.addListener(onSendHeaders, filterObject, ['requestHeaders']);
chrome.webRequest.onAuthRequired.addListener(onAuthRequired, filterObject);
chrome.webRequest.onBeforeRedirect.addListener(onBeforeRedirect, filterObject);
chrome.webRequest.onResponseStarted.addListener(onResponseStarted, filterObject);
chrome.webRequest.onCompleted.addListener(onCompleted, filterObject, ['responseHeaders']);
chrome.webRequest.onErrorOccurred.addListener(onErrorOccurred, filterObject);

function onErrorOccurred(details) {
	if (!isCapture || !requests[details.requestId]) return;
	$('div#' + details.requestId).children('i')
						.removeClass(function() { }) // すべてのクラスを外す
						.addClass('icon-warning-sign');

	requests[details.requestId].error = details.error;
	requests[details.requestId].statusLine = details.statusLine;
	requests[details.requestId].timeStamps.push({ name: 'onErrorOccurred', timeStamp: details.timeStamp });;

}

function onCompleted(details) {
	if (!isCapture || !requests[details.requestId]) return;

	var addCls;
	if (details.statusLine.match(/404|400|403|405|406|401|500|502|503|504/)) { // TODO もっとエラーのステータスコードがあるはずなので、それを追加する
		addCls = 'icon-warning-sign';
	} else {
		addCls = 'icon-ok';
	}
	$('div#' + details.requestId).children('i')
						.removeClass(function() { })
						.addClass(addCls);
						
	requests[details.requestId].responseHeaders = details.responseHeaders;
	requests[details.requestId].statusLine = details.statusLine;
	requests[details.requestId].timeStamps.push({ name: 'onCompleted', timeStamp: details.timeStamp });;
}

function onBeforeRequest(details) {
	if (!isCapture) return;
	if (captureTarget != 'all' && details.tabId != parseInt($('#target').val())) return;

	// リストに表示させるアイテムの作成
	var parsedURL = details.url.split('/');
	var fileName = $('<span>').text(parsedURL[parsedURL.length - 1] ? parsedURL[parsedURL.length - 1] : parsedURL[parsedURL.length - 2]);
	if (fileName.text().length > listThreshold && listThreshold != 0) {
		var fullPath = fileName.text().substr(listThreshold);
		fileName.text(fileName.text().substr(0, listThreshold));
		var btn = $('<a>').addClass('btn btn-mini')
						.attr('full-path', fullPath)
						.text('...')
						.click(function(e) {
							if (!$(this).hasClass('expand')) e.stopPropagation();
							$(this).removeClass('btn')
									.removeClass('btn-mini')
									.addClass('expand')
									.text($(this).attr('full-path'));	
						});
		fileName.append(btn);
	}
	delete parsedURL[parsedURL.length - 1];
	var pathName = $('<div>').text(parsedURL.join('/'))
							.addClass('path');
	
	$('<div>').append(STATUSICON)
			.append(fileName)
			.append(pathName)
			.addClass('caption')
			.attr('id', details.requestId)
			.click(function() {
				showRequest($(this).attr('id'));
			}).appendTo($('div#list'));
			
	if ($('#as').attr('checked')) { // Auto Scroll が on になっていればリストの一番下までスクロール
		_scroll($('div#list').get(0).scrollHeight, 0);
	}
	
	requests[details.requestId] = details;
	requests[details.requestId].timeStamps = [ ];
	requests[details.requestId].timeStamps.push({ name: 'onBeforeRequest', timeStamp: details.timeStamp });
};

function onSendHeaders(details) {
	if (!isCapture || !requests[details.requestId]) return;
	
	requests[details.requestId].requestHeaders = details.requestHeaders;
	requests[details.requestId].statusLine = details.statusLine;
	
	$('div#' + details.requestId).children('i')
						.removeClass(function() { })
						.addClass('icon-arrow-right');
						
	requests[details.requestId].timeStamps.push({ name: 'onSendHeaders', timeStamp: details.timeStamp });
}

function onBeforeSendHeaders(details) {
	if (!isCapture || !requests[details.requestId]) return;
	
	requests[details.requestId].statusLine = details.statusLine;
	requests[details.requestId].responseHeaders = details.responseHeaders;
	
	$('div#' + details.requestId).children('i')
						.removeClass(function() { })
						.addClass('icon-download-alt');
						
	requests[details.requestId].timeStamps.push({ name: 'onBeforeSendHeaders', timeStamp: details.timeStamp });;
};

function onHeadersReceived(details) {
	if (!isCapture || !requests[details.requestId]) return;
	
	requests[details.requestId].statusLine = details.statusLine;
	
	$('div#' + details.requestId).children('i')
						.removeClass(function() { })
						.addClass('icon-minus');
	requests[details.requestId].timeStamps.push({ name: 'onHeadersReceived', timeStamp: details.timeStamp });
						
};

function onAuthRequired(details) {
	if (!isCapture || !requests[details.requestId]) return;
	
	requests[details.requestId].statusLine = details.statusLine;
	// 認証情報を記憶
	requests[details.requestId].auth = { };
	requests[details.requestId].auth.scheme = details.scheme;
	requests[details.requestId].auth.challenger = details.challenger;
	requests[details.requestId].auth.isProxy = details.isProxy;
	requests[details.requestId].auth.realm = details.realm;
	requests[details.requestId].timeStamps.push({ name: 'onAuthRequired', timeStamp: details.timeStamp });
	
	$('div#' + details.requestId).children('i')
						.removeClass(function() { })
						.addClass('icon-lock');
};

function onBeforeRedirect(details) {
	if (!isCapture || !requests[details.requestId]) return;
	
	requests[details.requestId].statusLine = details.statusLine;
	requests[details.requestId].ip = details.ip;
	requests[details.requestId].fromCache = details.fromCache;
	requests[details.requestId].statusCode = details.statusCode;
	// リダイレクト情報を記憶
	requests[details.requestId].redirect = { };
	requests[details.requestId].redirect.redirectUrl = details.redirectUrl;
	requests[details.requestId].timeStamps.push({ name: 'onBeforeRedirect', timeStamp: details.timeStamp });;
	
	$('div#' + details.requestId).children('i')
						.removeClass(function() { })
						.addClass('icon-share-alt');	
}

function onResponseStarted(details) {
	if (!isCapture || !requests[details.requestId]) return;
	
	requests[details.requestId].statusLine = details.statusLine;
	requests[details.requestId].ip = details.ip;
	requests[details.requestId].fromCache = details.fromCache;
	requests[details.requestId].statusCode = details.statusCode;
	requests[details.requestId].timeStamps.push({ name: 'onResponseStarted', timeStamp: details.timeStamp });;
	
	$('div#' + details.requestId).children('i')
						.removeClass(function() { })
						.addClass('icon-download');	
	
}