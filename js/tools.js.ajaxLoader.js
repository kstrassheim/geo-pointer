var tools = tools || {}; tools.js = tools.js || {};

// The jquery selected css contai
tools.js.ajaxLoader = function (_containerSelector, _sizeContainerSelector, _loadingImageUrl) {

    // function - Create guid
    this.guidGenerator = function () {
        var S4 = function () { return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    };

    var containerSelector = _containerSelector;
    var sizeContainerSelector = _sizeContainerSelector;
    var loadingImageUrl = _loadingImageUrl;

    // generate a new id
    var loadingImageId = this.guidGenerator();

    // function a save ajax loader run with opening and closing
    this.runLoadingFunction = function (callback) {
        try {


            this.showLoading();
            if (callback && typeof (callback) === "function") {
                // execute the callback, passing parameters as necessary
                callback();
            }

            this.removeLoading();
        }
        catch (e) {
            this.removeLoading();
        }
    };

    // function - show loading image		
    this.showLoading = function () {


        var topPos = $(sizeContainerSelector).height() / 2;
        var leftPos = $(sizeContainerSelector).width() / 2;

        var loadingDiv = $('<div />')
            .attr('id', loadingImageId)
			.attr('src', _loadingImageUrl)
			.css('position', 'absolute')
			.css('top', 0)
			.css('left', 0)
            .css('width', $(sizeContainerSelector).width())
			.css('height', $(sizeContainerSelector).height())
			.attr('z-index', '999998')
            .attr('class', 'em_ajax_loader_panel');
        var loadingImg = $('<img />')
			.attr('id', loadingImageId + "_image")
			.attr('src', _loadingImageUrl)
			.css('position', 'absolute')
			.css('top', topPos)
			.css('left', leftPos)
			.attr('z-index', '999999')
            .attr('class', 'em_ajax_loader');
  
        loadingImg.prependTo(loadingDiv);
        loadingDiv.prependTo($(_containerSelector));


        loadingImg.css('left', (leftPos - loadingImg.width()));
        loadingImg.css('top', (topPos - loadingImg.height()));
    }

    // function - remove loading image		
    this.removeLoading = function () {
        $("#" + loadingImageId).remove();
    }

    return this;
};
