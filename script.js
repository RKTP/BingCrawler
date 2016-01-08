(function($, undefined) {
	var queryUrl = "https://api.datamarket.azure.com/Bing/Search/Image";
	var encodedKey = btoa(":NgrxKg56U9UaZq0w0z4ZEKRxgMt7LDGjKaHrPgpoY7M=");
	var that = this;

	function setHeader(xhr) {
	    xhr.setRequestHeader('Authorization','Basic '+encodedKey);
	}

	var crawler = {
		page: 0,
		getQueryResult: function(callback) {
			$.ajax({
				beforeSend: setHeader,
				type: "GET",
				url: queryUrl,
				data: {
					$format: "json",
					Query: encodeURIComponent("'"+$("#keyword").val()+"'"),
					$top: 10,//default
					$skip: this.page*10//default
				},
				dataType: "json",
				success: function(responseData) {
					var result = responseData["d"]["results"];
					callback(result);
					crawler.page++;
				}
			});
		}
	};

	function appendImage(result) {
		var parent = document.getElementById("result");
		for(var i=0; i < result.length; i++) {
			var image = document.createElement("img");
			image.src = result[i]["MediaUrl"];
			parent.appendChild(image);
		}
	}

	$("#btn_search").click(function() {
		$("#result").empty();
		crawler.page=0;
		crawler.getQueryResult(appendImage);
	});

	$(document).endlessScroll({
		callback: function(n) {
			crawler.getQueryResult(appendImage);
		}
	});
	
})(jQuery);