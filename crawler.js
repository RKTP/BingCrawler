(function($,undefined) {
	var resultMap = {};
	var ref = new Firebase("https://luminous-torch-8660.firebaseio.com/");//One's Firebase URL
	var imageRef = ref.child("images");

//required data for query
var bingQuery = {
	queryUrl: "https://api.datamarket.azure.com/Bing/Search/Image",
		encodedKey: btoa(":NgrxKg56U9UaZq0w0z4ZEKRxgMt7LDGjKaHrPgpoY7M="),//One's Azure account key
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
	var parent = $("#result");
	var structure = $("#script_template").html();
	var template = Handlebars.compile(structure);
	for(var i = 0; i < result.length; i++) {
		var html = template({imageSrc: result[i]["MediaUrl"]});
		parent.append(html);
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
	if($(this).find(".selection").is(':checked')) {
		var jsonData = resultMap[$(this).find(".image").attr("src")];
		var location = new URL(jsonData["MediaUrl"]);
		var host = btoa(location.origin);
		var path = btoa(location.href);
		var iref = imageRef.child(host).child(path);
		iref.once('value',function(snapshot) {
			if(!snapshot.exists()) {
				iref.set(jsonData);
			}
		});
	}
}

//event handling
var crawler = BufferedCrawler(appendImage);

$("#keyword").keyup(function(event) {
	if(event.keyCode == 13) {
		$("#btn_search").click();
	}
});

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
