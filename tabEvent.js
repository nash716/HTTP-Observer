chrome.tabs.onRemoved.addListener(onTabsRemoved);
chrome.tabs.onCreated.addListener(onTabsCreated);
chrome.tabs.onUpdated.addListener(onTabsUpdated);


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
