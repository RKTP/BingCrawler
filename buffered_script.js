(function(($,undefined)) {
//required data for query
	var queryUrl = "https://api.datamarket.azure.com/Bing/Search/Image";
	var encodedKey = btoa(":NgrxKg56U9UaZq0w0z4ZEKRxgMt7LDGjKaHrPgpoY7M=");
	function setHeader(xhr) {
	    xhr.setRequestHeader('Authorization','Basic '+encodedKey);
	}

//query
	function requestQuery(that, callback) {
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
				crawler.page++;
				callback(results);
			}
		});
	}

	var crawler = {
		page: 0,
		getFirstPage: function(callback) {

		},
		getNewPage: function(callback) {

		}
	}

//buffer
	var bufferStorage = {
		buffer: [],
		bufferMinSize: 1,


	}

	function bufferElem(callback) {
		var cb = callback;
	}

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
		crawler.page = 0;
		bufferStorage.buffer = [];

	});

	$(document).endlessScroll({
		callback:function(n) {

		}
	});
})(jQuery);