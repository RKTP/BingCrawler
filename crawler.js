(function($,undefined) {
	var resultMap = {};
	var ref = new Firebase("https://luminous-torch-8660.firebaseio.com/");
	var imageRef = ref.child("images");

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
	function requestQuery(config, callback) {
		$.ajax({
			beforeSend: config.setHeader,
			type: "GET",
			url: config.queryUrl,
			data: {
				$format: config.format,
				Query: encodeURIComponent("'"+config.inputText+"'"),
				$top: config.item,
				$skip: config.page++*(config.item)
			},
			dataType: "json",
			success: function(responseData) {
				var results = responseData["d"]["results"];
				callback(results.filter(function(result) {
					if (resultMap[result["MediaUrl"]]) {
						console.error("Duplicated:", result["MediaUrl"]);
						return false;
					}
					resultMap[result["MediaUrl"]] = result;
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
		var image, check, template, label;
		for(var i = 0; i < result.length; i++) {
			template = document.createElement("div");
			template.className = "imageView";
			parent.appendChild(template);

			label = document.createElement("label");

			image = document.createElement("img");
			image.src = result[i]["MediaUrl"];
			label.appendChild(image);

			check = document.createElement("input");
			check.type = "checkbox";
			check.className = "selection";
			check.checked = true;
			label.appendChild(check);

			template.appendChild(label);

			parent.appendChild(document.createElement("br"));
		}
	}

	var BufferedCrawler = function(callback) {
		var bufferInstance = buffer(callback);
		return {
			getFirstPage: function(config, optionalCallback) {
				bufferInstance.clear();
				requestQuery(config, optionalCallback || callback);
				requestQuery(config, bufferInstance.wrapper(optionalCallback));
			},
			getNewPage: function(config, optionalCallback) {
				requestQuery(config, bufferInstance.wrapper(optionalCallback));
			}
		};
	};

	var UnbufferedCrawler = function(callback) {
		return {
			getFirstPage: function(config, optionalCallback) {
				requestQuery(config, optionalCallback || callback);
			},
			getNewPage: function(config, optionalCallback) {
				requestQuery(config, optionalCallback || callback);
			}
		};
	};

//upload to Firebase DB
	function uploadImg() {
		if($(this.children[1]).is(':checked')) {
			var jsonData = resultMap[this.children[0].src];
			var location = new URL(jsonData["MediaUrl"]);
			var host = btoa(location.origin);
			var path = btoa(location.href);
			imageRef.once('value',function(snapshot) {
				var ref = snapshot.child(host).child(path);
				if(!ref.exists()) {
					ref.set(jsonData);
				}
			});
		}
	}

//event handling
	var crawler = BufferedCrawler(appendImage);

	$('#btn_save').click(function() {
		$('#result').find(".imageView").map(uploadImg);
	});

	$('#btn_search').click(function() {
		resultMap = {};
		var targetApi = bingQuery;
		targetApi.inputText = $('#keyword').val();
		$('#result').empty();
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
