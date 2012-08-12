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
	
	$('#clear').click(function() { location.reload(); });
	$('#toTop').click(function() { $('div#list').animate({scrollTop:0}, 800); });
	$('#toBottom').click(function() { $('div#list').animate({scrollTop:$('div#list').get(0).scrollHeight}, 800); });
	$('#saveSettings').click(function() { saveCaptureTarget(); });
	$('#saveThreshold').click(function() { saveThreshold(); });
	
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