// < や > などの置換
function text(str) {
	str = str.split('&').join('&amp;'); //.replace('&', '&amp;');
	str = str.split('"').join('&quot;'); //.replace('"', '&quot;');
	str = str.split('<').join('&lt;'); //.replace('<', '&lt;');
	str = str.split('>').join('&gt;'); //.replace('>', '&gt;');
	str = str.split("'").join('&#039;'); //.replace("'", '&#039;');
	return str;
}

// height に duration ミリ秒でスクロール
function _scroll(height, duration) {
	$('div#list').animate({ scrollTop : height }, duration);
}

// table を作る
function createTable(title1, title2) {
	var table = $('<table>').addClass('table table-condensed');
		var thead = $('<thead>');
			var tr = $('<tr>');
				var th1 = $('<th>').text(title1)
									.css('text-align', 'center');
				var th2 = $('<th>').text(title2)
									.css('text-align', 'center');
			tr.append(th1).append(th2);
		thead.append(tr);
	table.append(thead);
	
	return table;
}

// table の行を作る
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

// キャプチャターゲットの保存
function saveCaptureTarget() {
	captureTarget = $('#target option:checked').val();	
}

// 省略するしきい値の保存
function saveThreshold() {
	listThreshold = localStorage['listThreshold'] = $('#listview').val();
	detailThreshold = localStorage['detailThreshold'] = $('#detailview').val();
}