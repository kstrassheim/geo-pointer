// define namespace
var tools = tools || {}; tools.js = tools.js || {};

tools.js.__maps = (function (mapsSettings, mapsViewPorts, mapsMaps, mapsGeoData) {

    // variables
    this.settings = mapsSettings;
    var viewPorts = mapsViewPorts;
    var maps = mapsMaps;
    var geoData = mapsGeoData;

    var debugControlClass = ".debug .debugMsg";

    // function debug
    this.debug = function (msg) {
        if (settings.debugMode) {
            $(debugControlClass).append(msg).append("<br/>");
        }
    };

    // function clear debug
    this.clearDebug = function () {
        if (settings.debugMode) {
            $(debugControlClass).html("");
        }
    };

    // public create cookie
    this.createCookie = function (name, value, days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = name + "=" + value + (days ? "; expires=" + date.toGMTString() : "") + "; path=/";
    };

    // public read cookie	
    this.readCookie = function (name) {

        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }

        return null;
    };
    // public erase cookie	
    this.eraseCookie = function (name) {
        createCookie(name, "", -1);
    };

    // public sort view port ascending jquery function
    this.sortViewPortAscending = function (a, b) {
        var c = 0; var str1 = null; var str2 = null;

        while (str1 == str2 && (c < a.name.length && c < b.name.length)) {
            str1 = a.name.substring(c, c + 1).toLowerCase().charCodeAt(0);
            str2 = b.name.substring(c, c + 1).toLowerCase().charCodeAt(0);

            if (str1 > str2) {
                r = 1;
            } else if (str2 > str1) {
                r = -1;
            }

            c += 1;
        }
        return r;
    };

    // function read view port cookie 
    this.readViewPortCookie = function () {
        var cookieText = this.readCookie("viewPort");

        if (settings.cookiesEnabled && cookieText != null && cookieText != "") {
            debug("load cookie:" + cookieText);
            var arr = cookieText.split('##');
            var viewPortName = arr[0];
            var loadAllValues = arr[1] == "true";
            var showControlPanelValue = arr[2] == "true";
            var showFrameBorderValue = arr[3] == "true";
            return { "viewPortName": viewPortName, "loadAllMarkers": loadAllValues, "showControlPanel": showControlPanelValue, "showFrameBorder": showFrameBorderValue };
        }
        else {
            debug("cookies disabled");
            return { "viewPortName": "", "loadAllMarkers": true, "showControlPanel": true, "showFrameBorder": true };
        }
    };

    // function save view port cookie 
    this.saveViewPortCookie = function (viewPort) {
        if (viewPort == null) { viewPort = getCurrentViewPort(); };

        if (settings.cookiesEnabled && viewPort != null) {
            var cookieText = viewPort.displayName + '##' + viewPort.loadAllMarkers + '##' + viewPort.showControlPanel + '##' + viewPort.showFrameBorder;
            debug("save cookie:" + cookieText);
            this.eraseCookie("viewPort");
            this.createCookie("viewPort", cookieText, 5);
        }
        else {
            debug("cookies disabled");
        }
    };

    // function get map by name 
    this.getMapByName = function (mapName) {

        var map;
        $(maps).each(function () { if (this.name == mapName) { map = this; return; } });
        return map;
    };

    // function get view port display name
    this.getViewPortDisplayName = function (viewPort) {
        return (viewPort.countryCode != null && viewPort.countryCode != "") ? viewPort.countryCode + " - " + viewPort.name : viewPort.name;
    };

    // function get current view port
    this.getCurrentViewPort = function () {
        return getViewPortByName($(".viewPortOption" + $(".viewPortSelected").first().val()).html());
    };

    // function get view port by search function
    this.getViewPortBySearchFunction = function (searchFunction) {
        var viewPort;

        $(this.viewPorts).each(function () {

            var found = searchFunction(this);

            if (found == true) {
                viewPort = this;
                var displayName = getViewPortDisplayName(this);
                viewPort.displayName = displayName;
                return;
            }
        });

        if (viewPort != null) {
            viewPort.customImage = viewPort.image != null;
            viewPort.map = getMapByName(viewPort.mapName);

            if (!viewPort.customImage) { viewPort.image = viewPort.map.image; }

            // only get view width from view port in debug mode
            if (this.settings.debugMode) {
                if (viewPort.viewWidth == null || viewPort.viewWidth.viewWidth < 0) { viewPort.viewWidth = this.settings.viewWidth; }
                if (viewPort.viewHeight == null || viewPort.viewHeight < 0) { viewPort.viewHeight = this.settings.viewHeight; }
            }
            else {
                viewPort.viewWidth = this.settings.viewWidth;
                viewPort.viewHeight = this.settings.viewHeight;
            }
            // lead offset after assigning map to view port
            viewPort.offset = getMapOffsetForViewPort(viewPort);
            viewPort.loadAllMarkers = $('.cbLoadAllMarkers').is(':checked');
            viewPort.showControlPanel = $('.hideControlPanelSelector').is(':visible');
            viewPort.showFrameBorder = $('.cbShowFrameBorder').is(':checked');
        }

        return viewPort;
    };

    // function - get view port by country code
    this.getViewPortByCountryCode = function (countryCode) {
        return this.getViewPortBySearchFunction(function (viewPort) {
            return countryCode == viewPort.countryCode;

        });
    };

    // function - get view port by name
    this.getViewPortByName = function (viewPortName) {
        return this.getViewPortBySearchFunction(function (viewPort) {
            return viewPortName == getViewPortDisplayName(viewPort);
        });
    };

    // function load first view port
    this.loadFirstViewPort = function () {
        this.loadViewPortById($(".viewPortDropDown .viewPortSelection").first().val());
    };

    // function load view port by id
    this.loadViewPortById = function (id) {
        this.loadViewPortByName($(".viewPortOption" + id).html());
    };

    // function load view port by country code
    this.loadViewPortByCountryCode = function (countryCode) {
        this.loadViewPort(this.getViewPortByCountryCode(countryCode));
    };

    // function load view port by name
    this.loadViewPortByName = function (viewPortName) {
        this.loadViewPort(this.getViewPortByName(viewPortName));
    };

    // function load view port to controls
    this.loadViewPort = function (viewPort) {
        if (viewPort != null && viewPort.name != null) {
            debug("Loading view port:" + viewPort.name);
        }
        else {
            debug("Loading view port: null");
        }
        $(".viewPortSelection").removeClass("viewPortSelected");
        $(".viewPortSelection").each(function () {
            $(this).removeClass("viewPortSelected");
            if ($(this).html() == viewPort.displayName) {
                $(this).addClass("viewPortSelected");
            }
        });

        this.removeMarkers();
        this.loadMapForViewPort(viewPort);
        this.loadGeoData(viewPort);

        if (settings.debugMode) {
            this.saveViewPortCookie(viewPort);
        }
    };

    // function reload Current View Port
    this.reloadCurrentViewPort = function () {
        clearDebug();
        var currentViewPort = getCurrentViewPort();

        if (currentViewPort != null) { loadViewPort(currentViewPort); } else { loadFirstViewPort(); }
    };

    // function - Create guid
    this.guidGenerator = function () {
        var S4 = function () { return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    };

    // function - Insert new marker
    this.insertNewMarker = function () {
        var guid = guidGenerator();
        var markerHtml = "<div class=\"" + guid + " marker\" style=\"background-image:url('" + this.settings.pinImage + "')\"></div>";
        $(".map").append(markerHtml);
        return guid;
    };

    // function - Mercator calculation
    this.mercator = function (longitude, latitude, imageWidth, imageHeight) {
        latitude *= -1;
        var centerWidth = Math.floor(imageWidth / 2);
        var centerHeight = Math.floor(imageHeight / 2);

        // Convert to rad
        var radLongitude = longitude * Math.PI / 180;
        var radLatitude = latitude * Math.PI / 180;

        var pixelRadiusX = imageWidth / (2 * Math.PI);

        var xPos = radLongitude * pixelRadiusX;
        xPos += centerWidth;

        var yPos = 0.5 * Math.log((1 + Math.sin(radLatitude)) / (1 - Math.sin(radLatitude))) * pixelRadiusX;
        yPos += centerHeight;

        var obj = new Object();
        obj.x = xPos;
        obj.y = yPos;

        return obj;
    };

    // function - Get min marker name width
    this.getMinMarkerNameWidth = function (imageWidth, xOffset) {
        var minMarkerNameWidth = 100; var countWidth = imageWidth - xOffset; return (countWidth > minMarkerNameWidth) ? countWidth : minMarkerNameWidth;
    };

    // function - Get min marker left offset
    this.getMarkerLeftOffset = function (markerNameWidth) {
        var minMarkerNameWidth = 100; return (markerNameWidth > minMarkerNameWidth) ? 0 : markerNameWidth;
    };

    // function - Remove markers
    this.removeMarkers = function () {
        $(".pin").html("");
    };

    this.markPointOnMap = function (point, viewPort) {
        if (point != null) {
            if (viewPort == null) { viewPort = getCurrentViewPort(); }

            // Calculate position by mercator
            point.pos = mercator(point.Longitude, point.Latitude, viewPort.map.width, viewPort.map.height);

            // set over length
            setOverLength(point, viewPort);

            point.pos.x += viewPort.map.offsetX;
            point.pos.y += viewPort.map.offsetY;

            // round values
            point.pos.x = Math.floor(point.pos.x);
            point.pos.y = Math.floor(point.pos.y);

            // determine if the current point is in view and set a new marker to position
            point.pointInView = isPointInView(point.pos, viewPort.offset);

            if (point.pointInView) {
                debug(point.Title + " position:" + point.pos.x + ", " + point.pos.y + "<span style='color:green'> in view</span>");
                setNewMarkerToPosition(point, viewPort);
            }
            else {
                debug(point.Title + " position:" + point.pos.x + ", " + point.pos.y + " <span style='color:darkred'>not in view</span>");
            }

            return point.pointInView;
        }
        else {
            return false;
        }
    };

    this.setOverLength = function (point, viewPort) {
        // check for overwidth settings
        if (viewPort.overWidth != null && viewPort.overWidth > 0) {
            // if point pos is smaller than overwidth cell set pos to map width
            if (point.pos.x < (viewPort.offset.cellWidth * viewPort.overWidth)) {
                point.pos.x = viewPort.map.width + point.pos.x;
            }
        }

        // check for overwidth settings
        if (viewPort.overHeight != null && viewPort.overHeight > 0) {
            // if point pos is smaller than overwidth cell set pos to map width
            if (point.pos.y < (viewPort.offset.cellHeight * viewPort.overHeight)) {
                point.pos.y = viewPort.map.height + point.pos.y;
            }
        }
    }

    // function - is point in view
    this.isPointInView = function (pos, offset) {
        return pos.x >= offset.pointOffsetX && pos.x <= offset.borderX && pos.y >= offset.pointOffsetY && pos.y <= offset.borderY;
    };

    // function - set new marker to position
    this.setNewMarkerToPosition = function (point, viewport) {
        // calculate position in view
        point.pos.x = point.pos.x - viewport.offset.pointOffsetX;
        point.pos.y = point.pos.y - viewport.offset.pointOffsetY;

        var markerGuid = insertNewMarker();
        var markerId = "." + markerGuid;
        $(markerId).show();
        // The offsets calculated by the map
        var pinHeight = $(markerId).height();
        var pinWidth = $(markerId).width();

        if (settings.pinMarkingPos == "bottom") {
            var pinYOffset = pinHeight * -1; // / 2 * -1;

            point.pos.y += pinYOffset;
        }
        else if (settings.pinMarkingPos == "top") {

        }
        else // center
        {
            var pinXOffset = (pinWidth / 2) * -1;
            var pinYOffset = (pinHeight / 2) * -1; // / 2 * -1;

            point.pos.x += pinXOffset;
            point.pos.y += pinYOffset;
        }

        if (settings.debugMode && point.selfset) {
            debug("<strong>Name:</strong>" + point.Title + " <strong>PixelXPos:</strong>" + point.pos.x + " <strong>PixelYPos:</strong>" + point.pos.y);
        }

        //set position of pin image
        $(markerId).animate({ left: point.pos.x, top: point.pos.y }, 800);
        addExtendedPointInformation(markerId, point, viewport);
    };

    // overrideable function - add extended point information like name
    this.addExtendedPointInformation = function (markerSelector, point, viewport) {

        $(markerSelector).append("<div class='markerName'>" + point.Title + "</div>");
        // set marker name position
        var markerNameWidth = getMinMarkerNameWidth(viewport.map.width, point.pos.y);
        var markerLeftOffset = getMarkerLeftOffset(markerNameWidth);
        $(markerSelector + ' .markerName').css("width", markerNameWidth + "px");

        if (point.selfset) {
            $(markerSelector + ' .markerName').addClass("selfset");
        }

        if (markerLeftOffset > 0) {
            $(markerSelector + ' .markerName').css("left", "-" + markerLeftOffset + "px");
        }
    };

    // function - load geo data
    this.loadGeoData = function (viewPort) {
        if (viewPort == null) { viewPort = getCurrentViewPort(); }

        if (viewPort != null) {
            if (settings.debugMode) { $('.autoTests .autoTestsMsg').html(""); }

            jQuery.each($(geoData), function () {
                if (viewPort.loadAllMarkers || viewPort.countryCode == null || (viewPort.countryCode != null && this.countryCode != null && viewPort.countryCode == this.countryCode)) {
                    // log auto tests
                    if (settings.debugMode) {
                        $('.autoTests .autoTestsMsg').append(this.Title + ", Long:" + this.Longitude + ", Lat:" + this.Latitude + "<br/>");
                    }

                    this.selfset = false;

                    markPointOnMap(this, viewPort);
                }
            });
        }
    };

    // function - load map for view port
    this.loadMapForViewPort = function (viewPort) {

        if (viewPort != null) {
            //get background x row offset
            var offset = viewPort.offset;

            debug("Loading map - name:" + viewPort.map.name + " image:" + viewPort.image + " offsetX:" + offset.pointOffsetX + " offsetY:" + offset.pointOffsetY);

            var left = (offset.viewOffsetX * -1);
            var top = (offset.viewOffsetY * -1); ;

            if (!viewPort.customImage) { left = (offset.pointOffsetX * -1); top = (offset.pointOffsetY * -1); }

            var mapImage = "<img src='" + this.settings.mapImagePath + viewPort.image + "' style='" + "position:absolute;" + "left:" + left + "px;" + "top:" + top + "px;" + "' alt='map' width: />";

            $(".map").attr("style", "width: " + viewPort.viewWidth + "px; height: " + viewPort.viewHeight + "px; position:relative;");
            $(".map").html(mapImage);

            // display frame border;
            $(".frameBorder").remove();
            if (viewPort.showFrameBorder) {
                var frameBorderLeft = (viewPort.viewWidth / 2) - (this.settings.viewWidth / 2);
                var frameBorderTop = (viewPort.viewHeight / 2) - (this.settings.viewHeight / 2);

                var frameBorder = "<div class='frameBorder' style='position:absolute;top:" + frameBorderTop + "px;left:" + frameBorderLeft + "px;z-index:99999;width:" + this.settings.viewWidth + "px;height:" + this.settings.viewHeight + "px;' ></div>";
                $(".mapWrap").append(frameBorder);
            }
        }
    };

    // function - get map offset for view port
    this.getMapOffsetForViewPort = function (viewPort) {
        var obj = new Object();

        obj.mapWidth = viewPort.map.width;
        obj.mapHeight = viewPort.map.height;

        // calculate cell width
        obj.cellWidth = viewPort.map.width / viewPort.map.cols;
        obj.cellHeight = viewPort.map.height / viewPort.map.rows;

        // get calculated view offset to center the view
        obj.viewOffsetX = ((obj.cellWidth * viewPort.width) / 2) - (viewPort.viewWidth / 2);
        obj.viewOffsetY = ((obj.cellHeight * viewPort.height) / 2) - (viewPort.viewHeight / 2);

        //Add manual view offset
        obj.viewOffsetX += (viewPort.offsetX) * -1;
        obj.viewOffsetY += (viewPort.offsetY) * -1;

        // Get offset for point calculations
        obj.pointOffsetX = ((viewPort.col * obj.cellWidth)) + obj.viewOffsetX;
        obj.pointOffsetY = ((viewPort.row * obj.cellHeight)) + obj.viewOffsetY;

        obj.borderX = obj.pointOffsetX + viewPort.viewWidth;
        obj.borderY = obj.pointOffsetY + viewPort.viewHeight;

        return obj;
    }

    // function - initialize view ports
    this.initializeViewPorts = function () {

        if (settings.debugMode) {
            var viewPortCookie = readViewPortCookie();

            // init control panel state from cookie
            showHideViewPortControlPanel(viewPortCookie.showControlPanel, true, false);
            var i = 0;

            // create view port selection box
            var html = "<span class='desc viewPortSelectionDesc viewPortDropDownDesc' style='float:left;'>Viewport selection:&nbsp;</span><select class='viewPortDropDown'>";
            $(viewPorts).each(function () {
                var guid = guidGenerator();
                html += "<option class='viewPortSelection viewPortOption" + guid + "' value='" + guid + "'";
                var viewPortDisplayName = getViewPortDisplayName(this);
                if (viewPortCookie != null && (viewPortCookie.viewPortName == "" && i < 1) || (viewPortCookie.viewPortName != "" && viewPortDisplayName == viewPortCookie.viewPortName)) {
                    html += " selected='selected'";
                }

                html += ">" + viewPortDisplayName + "</option>";
                i++;
            });

            html += "</select>";

            // Create check box for frame border
            html += "<input id='cbShowFrameBorder' class='viewPortCheckBox cbShowFrameBorder' name='cbShowFrameBorder' type='checkbox'";
            if (viewPortCookie.showFrameBorder) { html += " checked='checked'"; } // set checked state
            html += "><span class='desc viewPortSelectionDesc showFrameBorderDesc'>Show frame border</span></input>";

            // Create check box to select of 
            html += "<input id='cbLoadAllMarkers' class='viewPortCheckBox cbLoadAllMarkers' name='cbLoadAllMarkers' type='checkbox'";
            if (viewPortCookie.loadAllMarkers) { html += " checked='checked'"; } // set checked state
            html += "><span class='desc viewPortSelectionDesc loadAllMarkersDesc'>Load all markers <span style=' font-style:italic;' >(If not checked view port will load only load coordinates by country code)</span></span></input>";

            // add controls
            $('.viewPortSelector').append(html);

            // assign events
            $('.viewPortDropDown').change(function () { clearDebug(); loadViewPortById($(this).val()); });
            $('.cbLoadAllMarkers').click(function () { clearDebug(); reloadCurrentViewPort(); });
            $('.cbShowFrameBorder').click(function () { clearDebug(); reloadCurrentViewPort(); });

            if (settings.selectedViewPortCountryCode != null && settings.selectedViewPortCountryCode != "") {
                loadViewPortByCountryCode(settings.selectedViewPortCountryCode);
            }
            // initialize starting view port (FROM COOKIE OR FIRST IN LIST)
            else if (viewPortCookie.viewPortName != "") {
                loadViewPortByName(viewPortCookie.viewPortName);
            }
            else {
                loadFirstViewPort();
            }

        }

        // release mode
        if (settings.selectedViewPortCountryCode != null && settings.selectedViewPortCountryCode != "") {
            loadViewPortByCountryCode(settings.selectedViewPortCountryCode);
        }

    };

    // function - show hide view port control buttons
    this.showHideViewPortControlPanel = function (show, fastSlide, saveCookie) {
        var slidingTime = fastSlide ? 1 : 500;
        if (show) {
            $(document).ready(function () { $('.controlPanel').slideDown(slidingTime, function () { $('.showControlPanelSelector').hide(); $('.hideControlPanelSelector').show(); if (saveCookie) saveViewPortCookie(); }) });
        }
        else {
            $(document).ready(function () { $('.controlPanel').slideUp(slidingTime, function () { $('.hideControlPanelSelector').hide(); $('.showControlPanelSelector').show(); if (saveCookie) saveViewPortCookie(); }) });
        }
    };


    // function
    this.btnLoadMarkerClick = function () {
        if (settings.debugMode) {
            clearDebug();
            //validate input longitude
            if ($('.inputContainer .longInput').val() >= 180.0 || $('.inputContainer .longInput').val() <= -180.0) {
                alert('Only longitude from -180° to 180° is valid.');
                $('.inputContainer .longInput').val(0);
                return false;
            }

            //validate input latitude
            if ($('.inputContainer .latInput').val() > 84.00 || $('.inputContainer .latInput').val() < -84.00) {
                alert('Only latitude from -90° to 90° is valid.');
                $('.inputContainer .latInput').val(0)

                return false;
            }

            // Get text box values
            debug("mark point: long-" + $('.inputContainer .nameInput').val());
            var point = { "Title": $('.inputContainer .nameInput').val(), "Longitude": parseFloat($('.inputContainer .longInput').val()), "Latitude": parseFloat($('.inputContainer .latInput').val()), "selfset": true };

            var marked = markPointOnMap(point, null);
            if (!marked) {
                alert('The entered point is not in the selected view');
                return false;
            }
        }
    };

    this.HtmlStructure = (function () {


    } ());

    // function include html controls
    this.includeControls = function (appContainerSelector, debugMode) {

        var appContainer = $(appContainerSelector);

        // variable - the map wrap container
        var mapWrap = "<div class='mapWrap'><div class='map viewPortBox'><div class='pin'></div></div></div>";

        if (debugMode) {
            // variable - the view port selector
            var viewPortSelector = "<div class='viewPortBox viewPortSelector'></div>";

            // variable - the view port control panel
            var viewPortControlPanel = "<div class='viewPortBox controlPanelContainer'>";
            viewPortControlPanel += "<div class='controlPanel' style='display:block'>";
            viewPortControlPanel += "<div class='container inputContainer'>";
            viewPortControlPanel += "<h3>Enter geo data</h3>";
            viewPortControlPanel += "<div class='inputs'>";
            viewPortControlPanel += "<div class='link geoInputContainer'>";
            viewPortControlPanel += "<span class='desc'>Coordinates:</span>";
            viewPortControlPanel += "<a href='http://www.svensoltmann.de/maps-koordinaten.html' class='external'>Get coordinates from cities</a>";
            viewPortControlPanel += "</div>";
            viewPortControlPanel += "<div class='name geoInputContainer'>";
            viewPortControlPanel += "<span class='desc'>Name:</span>";
            viewPortControlPanel += "<input type='text' id='pinname' name='pinname' class='geoInput nameInput' value='' />";
            viewPortControlPanel += "</div>";
            viewPortControlPanel += "<div class='long geoInputContainer'>";
            viewPortControlPanel += "<span class='desc'>Longtitude:</span>";
            viewPortControlPanel += "<input type='text' id='longtitude' name='longitude' class='geoInput longInput' value='8.638590574264526' />";
            viewPortControlPanel += "</div>";
            viewPortControlPanel += "<div class='lat geoInputContainer'>";
            viewPortControlPanel += "<span class='desc'>Latitude</span>";
            viewPortControlPanel += "<input type='text' id='latitude' name='latitude' class='geoInput latInput' value='49.87871190046309' />";
            viewPortControlPanel += "</div>";
            viewPortControlPanel += "</div>";
            viewPortControlPanel += "<div class='buttonRow'>";
            viewPortControlPanel += "<button type='submit' class='button' title='Set marker'>Set marker</button>";
            viewPortControlPanel += "<button title='reset' type='reset'  onclick='window.location.href='index.html''>Reset</button>";
            viewPortControlPanel += "</div>";
            viewPortControlPanel += "</div>";
            viewPortControlPanel += "<div class='autoTests container autoTestContainer'>";
            viewPortControlPanel += "<h3>AutoTests:</h3>";
            viewPortControlPanel += "<div class='autoTestsMsg'></div>";
            viewPortControlPanel += "</div>";
            viewPortControlPanel += "<div class='debug container debugContainer'>";
            viewPortControlPanel += "<h3>Debug:</h3>";
            viewPortControlPanel += "<div class='debugMsg'></div>";
            viewPortControlPanel += "</div>";
            viewPortControlPanel += "</div>";
            viewPortControlPanel += "<div class='controlPanelSelector'>";
            viewPortControlPanel += "<a class='desc controlPanelSelectorDesc showControlPanelSelector' href='#' style='display:none;' ><< Show Control Panel</a>";
            viewPortControlPanel += "<a class='desc controlPanelSelectorDesc hideControlPanelSelector' href='#' >>> Hide Control Panel</a>";
            viewPortControlPanel += "</div>";
            viewPortControlPanel += "</div>";

            appContainer.append(viewPortSelector);
            appContainer.append(viewPortControlPanel);
        }

        appContainer.append(mapWrap);
    };

    //private run function 
    this.run = function (callback) {
        includeControls(settings.appContainerSelector, settings.debugMode);
        //Links mit class="external" im neuen Fenster öffnen
        if (settings.debugMode) {
            clearDebug();
        }

        initializeViewPorts();

        //go button click function	
        if (settings.debugMode) {
            $('.button').click(btnLoadMarkerClick);

            $('.showControlPanelSelector').click(function () { showHideViewPortControlPanel(true, false, true); });
            $('.hideControlPanelSelector').click(function () { showHideViewPortControlPanel(false, false, true); });
        }

        if (callback && typeof (callback) === "function") {
            // execute the callback, passing parameters as necessary

            callback();
        }
    };

    this.reloadByCountryCode = function (countryCode) {
        this.loadViewPortByCountryCode(countryCode);
    };

    // reload by country code by resetting geoData
    this.updateByCountryCode = function (countryCode, geoData) {
        this.resetGeoData(geoData);
        this.loadViewPortByCountryCode(countryCode);
    };

    // reset the geo data
    this.resetGeoData = function (newGeoData) {
        geoData = newGeoData;
    };

    // constructor loader
    return this;
} (mapsSettings, viewPorts, maps, geoData));

tools.js.maps = { run: function (callback) { tools.js.__maps.run(callback); }, reloadByCountryCode: function (countryCode) { tools.js.__maps.reloadByCountryCode(countryCode); }, updateByCountryCode: function (countryCode, newGeoData) { tools.js.__maps.updateByCountryCode(countryCode, newGeoData); }, resetGeoData : function (newGeoData) { tools.js.__maps.resetGeoData(newGeoData); }, sortViewPortAscending: function (a, b) { return tools.js.__maps.sortViewPortAscending(a, b); } };