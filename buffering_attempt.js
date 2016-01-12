(function($,undefined) {
	var map = {};
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
				$skip: cond.page++*(cond.item)
			},
			dataType: "json",
			success: function(responseData) {
				var results = responseData["d"]["results"];
				callback(results.filter(function(result) {
					if (map[result["SourceUrl"]]) {
						console.error("Duplicated:", result["MediaUrl"]);
						return false;
					}
					map[result["SourceUrl"]] = result;
					return true;
				}));
			}
		});
	}

//buffer
	function buffer(callback) {
		var storage = [];
		var minSize = 1;

		function callBufferedWrappers() {
			var wrapper;
			while (storage.length > minSize && storage[0].args) {
				wrapper = storage.shift();
				wrapper.apply(this, wrapper.args);
			}
		}

		return {
			wrapper: function(optionalCallback) {
				var wrapper = function() {
					(optionalCallback || callback).apply(this, arguments);
				};
				storage.push(wrapper);
				callBufferedWrappers();

				return function() {
					wrapper.args = arguments;
					callBufferedWrappers();
				};
			},
			clear: function() {
				storage = [];
			}
		};
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

	var BufferedCrawler = function(callback) {
		var bufferInstance = buffer(callback);
		return {
			getFirstPage: function(cond, optionalCallback) {
				bufferInstance.clear();
				requestQuery(cond, optionalCallback || callback);
				requestQuery(cond, bufferInstance.wrapper(optionalCallback));
			},
			getNewPage: function(cond, optionalCallback) {
				requestQuery(cond, bufferInstance.wrapper(optionalCallback));
			}
		};
	};

	var UnbufferedCrawler = function(callback) {
		return {
			getFirstPage: function(cond, optionalCallback) {
				requestQuery(cond, optionalCallback || callback);
			},
			getNewPage: function(cond, optionalCallback) {
				requestQuery(cond, optionalCallback || callback);
			}
		};
	};

//event handling
	var crawler = BufferedCrawler(appendImage);

	$("#btn_search").click(function() {
		var targetApi = bingQuery;
		targetApi.inputText = $('#keyword').val();
		$("#result").empty();
		$('#label').text(targetApi.inputText);
		
		targetApi.page = 0;
		crawler.getFirstPage(targetApi);
	});

	$(document).endlessScroll({
		callback:function(n) {
			var targetApi = bingQuery;
			crawler.getNewPage(targetApi);
		}
	});
})(jQuery);
