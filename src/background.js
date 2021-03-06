chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.windows.getAll({ populate: true} , function(windows) {
		for (var i=0; i<windows.length; i++) {
			var tabs = windows[i].tabs;
			for (var j=0; j<tabs.length; j++) {
				if (tabs[j].url.match(chrome.extension.getURL('main.html'))) {
					chrome.tabs.update(parseInt(tabs[j].id), { selected: true });
					return;
				}
			}
		}
		chrome.tabs.create({
			url: 'main.html',
			selected: true
		});
	});
});