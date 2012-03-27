"use strict";

var STATUSICON = '<i class="icon-list"></i>';
var REQUEST = '<b>Request Headers: </b><br />';
var RESPONSE = '<b>Response Headers: </b><br />';
var DETAILS = '<b>Details: </b><br />';
var STATUSLINE = '<b>Status Line: </b>';
var AUTH = '<b>Auth info: </b>';
var ERROR = '<b><span class="error">Error</span>: </b>';
var EVENT = '<b>Event timeline: </b>';
var MARGIN = 10;
var NAVBAR_HEIGHT = 40;
var EXT_VERSION = 0.3;
var TABBAR_HEIGHT = 53;

var requests = { };
var isCapture = true;
var captureTarget = 'all';
var filterObject = { urls: [ 'http://*/*', 'https://*/*' ] };
var listThreshold = localStorage['listThreshold'] ? localStorage['listThreshold'] : 0;
var detailThreshold = localStorage['detailThreshold'] ? localStorage['detailThreshold'] : 0;
var isAutoScrollEnabled = ( localStorage['isAutoScrollEnabled'] == 'checked' ) ? 'checked' : '';

$(document).ready(function() {
	setTimeout(function() {
		$('div#list').css('height', ( $(document).height() - NAVBAR_HEIGHT - MARGIN ) + 'px');
		$('div.tab-content').css('height', ( $(document).height() - NAVBAR_HEIGHT - MARGIN - TABBAR_HEIGHT) + 'px');
	}, 100);

	$('#checkbox').click(function(e) {
		$('#as').attr('checked', !$('#as').attr('checked'));
		isAutoScrollEnabled = localStorage['isAutoScrollEnabled'] = $('#as').attr('checked');
		e.stopPropagation(); // ポップアップが閉じてしまうのを防ぐ
	});

	$('#checkbox-capture').click(function(e) {
		$('#iscapture').attr('checked', !$('#iscapture').attr('checked'));
		isCapture =  $('#iscapture').attr('checked');
		e.stopPropagation();
	});

	$('#update').on('shown', function(e) {
		$.ajax({
			url: 'http://chrome.nash-dev.com/observer.version.json',
			type: 'GET',
			dataType: 'json',
			success: function(data) {
				if (data.version > EXT_VERSION) {
					$('#checkupdate').html('Newer version is available!<br />Click "Update" to open the download link!');
					$('#update .modal-footer').append(
						$('<a>').addClass('btn btn-primary')
								.text('Update')
								.attr('href', data.download)
								.attr('target', '_blank')
					);
				} else {
					$('#checkupdate').html('No updates.');
				}
			},
			error: function(xhr, status, err) {
				$('#checkupdate').html('Could not check for updates.');
			}
		});
	});

	if (isAutoScrollEnabled == 'checked') {
		$('#as').attr('checked', true);
	}

	$('#listview').val(listThreshold);
	$('#detailview').val(detailThreshold);

	$('<option>').val('all')
			.html('All')
			.appendTo($('#target'));
	
	// キャプチャターゲットの設定項目を作成
	chrome.windows.getAll({ populate: true } , function(windows) {
		for (var i=0; i<windows.length; i++) {
			var tabs = windows[i].tabs;
			for (var j=0; j<tabs.length; j++) {
				$('<option>').val(tabs[j].id)
						.html(text(tabs[j].title))
						.appendTo($('#target'));
			}
		}
	});

});

chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, filterObject);
chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, filterObject);
chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, filterObject);
chrome.webRequest.onSendHeaders.addListener(onSendHeaders, filterObject, ['requestHeaders']);
chrome.webRequest.onAuthRequired.addListener(onAuthRequired, filterObject);
chrome.webRequest.onBeforeRedirect.addListener(onBeforeRedirect, filterObject);
chrome.webRequest.onResponseStarted.addListener(onResponseStarted, filterObject);
chrome.webRequest.onCompleted.addListener(onCompleted, filterObject, ['responseHeaders']);
chrome.webRequest.onErrorOccurred.addListener(onErrorOccurred, filterObject);

chrome.tabs.onRemoved.addListener(onTabsRemoved);
chrome.tabs.onCreated.addListener(onTabsCreated);
chrome.tabs.onUpdated.addListener(onTabsUpdated);

function text(str) {
	str = str.split('&').join('&amp;'); //.replace('&', '&amp;');
	str = str.split('"').join('&quot;'); //.replace('"', '&quot;');
	str = str.split('<').join('&lt;'); //.replace('<', '&lt;');
	str = str.split('>').join('&gt;'); //.replace('>', '&gt;');
	str = str.split("'").join('&#039;'); //.replace("'", '&#039;');
	return str;
}

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

// キャプチャターゲットが変更された際の処理
function onTabsRemoved(tabId) {
	$('#target option[value=' + tabId + ']').remove();
	$('#target').val('all');
	captureTarget = 'all';
};

function onTabsCreated(tab) {
	$('<option>').attr('value', tab.id)
				.html(text(tab.title))
				.appendTo($('#target'));
};

function onTabsUpdated(tabId, info, tab) {
	$('#target option[value=' + tabId + ']').text(tab.title);
};

function _scroll(height, duration) {
	$('div#list').animate({ scrollTop : height }, duration);
}

function showRequest(requestId) {
	if (!requests[requestId]) return;
	
	var details = requests[requestId];
	$('#status-line').contents().remove();
	$('#request').contents().remove();
	$('#response').contents().remove();
	$('#error').contents().remove();
	$('#details').contents().remove();

// status line
	if (details.statusLine) {
		$('#status-line').append(STATUSLINE + details.statusLine);
	} else {
		$('#status-line').append('No contents');
	}

// request headers
	if (details.requestHeaders) {
		$('#request').append(REQUEST);
		
		var table = $('<table>').addClass('table table-condensed');
			var thead = $('<thead>');
				var tr = $('<tr>');
					var th1 = $('<th>').text('Key');
					var th2 = $('<th>').text('Value');
				tr.append(th1).append(th2);
			thead.append(tr);
		table.append(thead);
		
		var tbody = $('<tbody>');		
		for(var key in details.requestHeaders) {
			tbody.append(createTableRow(details.requestHeaders[key].name, details.requestHeaders[key].value));
		}
		table.append(tbody);
		
		$('#request').append(table);
	} else {
		$('#request').append('No contents');
	}

// response headers
	if (details.responseHeaders) {
		$('#response').append(RESPONSE);
		
		var table = $('<table>').addClass('table table-condensed');
			var thead = $('<thead>');
				var tr = $('<tr>');
					var th1 = $('<th>').text('Key');
					var th2 = $('<th>').text('Value');
				tr.append(th1).append(th2);
			thead.append(tr);
		table.append(thead);
	
		var tbody = $('<tbody>');		
		for(var key in details.responseHeaders) {
			tbody.append(createTableRow(details.responseHeaders[key].name, details.responseHeaders[key].value));
		}
		table.append(tbody);
		
		$('#response').append(table);
	} else {
		$('#response').append('No contents');
	}

// error
	if (details.error) {
		$('#error').append(ERROR + details.error + '<br />');
	} else {
		$('#error').append('No contents');
	}
	
// details
	console.log(details);
	$('#details').append(DETAILS);
		
	var table = $('<table>').addClass('table table-condensed');
		var thead = $('<thead>');
			var tr = $('<tr>');
				var th1 = $('<th>').text('Key');
				var th2 = $('<th>').text('Value');
			tr.append(th1).append(th2);
		thead.append(tr);
	table.append(thead);

	var tbody = $('<tbody>');

	if (details.url) {
		tbody.append(createTableRow('URL', details.url));
	}
	if (details.method) {
		tbody.append(createTableRow('Method', details.method));
	}
	if (details.ip) {
		tbody.append(createTableRow('IP', details.ip));
	}
	if (details.fromCache != undefined) {
		tbody.append(createTableRow('FromCache', details.fromCache));
	}
	if (details.statusCode) {
		tbody.append(createTableRow('StatusCode', details.statusCode));
	}
	if (details.type) {
		tbody.append(createTableRow('Type', details.type));
	}
	if (details.redirect) {
		if (details.redirect.redirectUrl) {
			tbody.append(createTableRow('RedirectURL', details.redirect.redirectUrl));
		}
	}

	if (tbody.children().length == 0) {
		$('#details').append('No contents');
	} else {
		table.append(tbody);
		$('#details').append(table);
	}
	
	if (details.auth) {
		$('#details').append(AUTH);
		
		var table = $('<table>').addClass('table table-condensed');
			var thead = $('<thead>');
				var tr = $('<tr>');
					var th1 = $('<th>').text('Key');
					var th2 = $('<th>').text('Value');
				tr.append(th1).append(th2);
			thead.append(tr);
		table.append(thead);
		
		var tbody = $('<tbody>');
		
		if (details.auth.challenger) {
			tbody.append(createTableRow('Challenger', details.auth.challenger.host + ':' + details.auth.challenger.port));
		}
		if (details.auth.isProxy != undefined) {
			tbody.append(createTableRow('isProxy', details.auth.isProxy));
		}
		if (details.auth.realm) {
			tbody.append(createTableRow('realm', details.auth.realm));
		}
		if (details.auth.realm) {
			tbody.append(createTableRow('Scheme', details.auth.scheme));
		}
		
		if (tbody.children().length != 0) {
			table.append(tbody);
			$('#details').append(table);
		} else {
			$('#details').append('No contents');
		}
	}
// timeline
	$('#details').append(EVENT);
	
	var table = $('<table>').addClass('table table-condensed');
		var thead = $('<thead>');
			var tr = $('<tr>');
				var th1 = $('<th>').text('Event')
									.css('text-align', 'center');
				var th2 = $('<th>').text('TimeStamp')
									.css('text-align', 'center');
			tr.append(th1).append(th2);
		thead.append(tr);
	table.append(thead);

	var tbody = $('<tbody>');
	
	for (var i=0; i<details.timeStamps.length; i++) {
		tbody.append(createTableRow(details.timeStamps[i].name, details.timeStamps[i].timeStamp, true));
		if (i + 1 != details.timeStamps.length) {
			var tr = $('<tr>');
				var td = $('<td>');
					var icon = $('<i>').addClass('icon-arrow-down');
				td.attr('colspan', '2')
					.css('text-align', 'center')
					.append(icon)
					.append(( details.timeStamps[i+1].timeStamp - details.timeStamps[i].timeStamp ).toFixed(4) + ' ms');
			tr.append(td);
			tbody.append(tr);
		}
	}
	
	if (tbody.children().length != 0) {
		table.append(tbody);
		$('#details').append(table);
	} else {
		$('#details').append('No contents');
	}
}

function createTableRow(key, value, isCenter) {
	var tr = $('<tr>');
	var td1 = $('<td>').text(key).css('white-space', 'nowrap');
	if (isCenter) {
		td1.css('text-align', 'center');
	}
	var td2 = $('<td>').text(value);
	if (isCenter) {
		td2.css('text-align', 'center');
	}
	if (td2.text().length > detailThreshold && detailThreshold != 0) {
		var fullStr = td2.text().substr(detailThreshold);
		td2.text(td2.text().substr(0, detailThreshold));
		var btn = $('<a>').addClass('btn btn-mini')
						.attr('full-str', fullStr)
						.text('...')
						.click(function(e) {
							e.stopPropagation();
							$(this).removeClass('btn')
									.removeClass('btn-mini')
									.addClass('expand')
									.text($(this).attr('full-str'));	
						});
		td2.append(btn);
	}
	tr.append(td1).append(td2);
	
	return tr;
}

function saveCaptureTarget() {
	captureTarget = $('#target option:checked').val();	
}

function saveThreshold() {
	listThreshold = localStorage['listThreshold'] = $('#listview').val();
	detailThreshold = localStorage['detailThreshold'] = $('#detailview').val();
}