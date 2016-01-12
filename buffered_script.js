(function($,undefined) {
//required data for query
	var bingQuery = {
		queryUrl: "https://api.datamarket.azure.com/Bing/Search/Image",
		encodedKey: btoa(":NgrxKg56U9UaZq0w0z4ZEKRxgMt7LDGjKaHrPgpoY7M="),
		inputText: "",
		setHeader: function(xhr) {
			xhr.setRequestHeader('Authorization','Basic '+bingQuery.encodedKey);
		},
		format: "json",
		page: 0,
		item: 10
	}

//query
/*
	function requestQuery(that, callback) {
		var result;
		$.ajax({
			beforeSend: setHeader,
			type: "GET",
			url: queryUrl,
			data: {
				$format: "json",
				Query: encodeURIComponent("'"+$("#keyword").val()+"'"),
				$top: 10,//default
				$skip: that.page*10//default
			},
			dataType: "json",
			success: function(responseData) {
				var results = responseData["d"]["results"];
				result = results;
			}
		});
		that.page++;
		return callback(result);
	}*/

	function requestQuery(cond, callback) {
		var queryCond = cond;
		$.ajax({
			beforeSend: cond.setHeader,
			type: "GET",
			url: cond.queryUrl,
			data: {
				$format: cond.format,
				Query: encodeURIComponent("'"+cond.inputText+"'"),
				$top: cond.item,
				$skip: cond.page++*cond.item
			},
			dataType: "json",
			success: function(responseData) {
				var results = responseData["d"]["results"];
				callback(results);
			}
		});
	}

	var crawler = {
		getFirstPage: function(cond, callback) {
			requestQuery(cond, callback);
		},
		getNewPage: function(cond, callback) {
			requestQuery(cond, callback);
		}
	}

/*
//buffer
	var bufferStorage = {
		buffer: [],
		bufferMinSize: 1,
		firstCall: function(callback) {
			crawler.getFirstPage(callback);
			while(this.buffer.length < this.bufferMinSize) {
				this.buffer.push(crawler.getNewPage(callback));
			}
		},
		onCall: function() {
			while(this.buffer[0].dataRequested && this.buffer.length > this.bufferMinSize) {
				this.buffer[0].dataRequested();
				this.buffer.shift();
			}
		},
		prepareCall: function(callback) {
			while(this.buffer.length <= this.bufferMinSize) {
				this.buffer.push(crawler.getNewPage(callback));
			}
		}
	}*/

//draw
	function appendImage(result) {
		var parent = document.getElementById("result");
		var image;
		for(var i = 0; i < result.length; i++) {
			image = document.createElement("img");
			image.src = result[i]["MediaUrl"];
			parent.appendChild(image);
		}
	}

//event handling
	$("#btn_search").click(function() {
		var targetApi = bingQuery;
		targetApi.inputText = $('#keyword').val();
		$("#result").empty();
		$('#label').text(targetApi.inputText);
		
		targetApi.page = 0;
		crawler.getFirstPage(targetApi, appendImage);
//		bufferStorage.buffer = [];
//		bufferStorage.firstCall(appendImage);
	});

	$(document).endlessScroll({
		callback:function(n) {
			var targetApi = bingQuery;
			crawler.getNewPage(targetApi, appendImage);
//		bufferStorage.prepareCall(appendImage);
//		bufferStorage.onCall();
		}
	});
})(jQuery);
