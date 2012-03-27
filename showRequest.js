// 詳細ビューを作る
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
		
		var table = createTable();
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
		
		var table = createTable();
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
	//console.log(details);
	$('#details').append(DETAILS);
		
	var table = createTable();
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
		
		var table = createTable();
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
		if (details.auth.scheme) {
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
	
	var table = createTable();
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
