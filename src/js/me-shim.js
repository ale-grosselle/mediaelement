/*
 Default options
 */
mejs.MediaElementDefaults = {
	// allows testing on HTML5, flash
	// auto: attempts to detect what the browser can do
	// auto_plugin: prefer plugins and then attempt native HTML5
	// native: forces HTML5 playback
	// shim: disallows HTML5, will attempt either Flash
	// none: forces fallback view
	mode: 'auto',
	// remove or reorder to change plugin priority and availability
	plugins: ['flash'],
	// shows debug errors on screen
	enablePluginDebug: false,
	// use plugin for browsers that have trouble with Basic Authentication on HTTPS sites
	httpsBasicAuthSite: false,
	// overrides the type specified, useful for dynamic instantiation
	type: '',
	// path to Flash plugins
	pluginPath: mejs.Utility.getScriptPath(['mediaelement.js', 'mediaelement.min.js', 'mediaelement-and-player.js', 'mediaelement-and-player.min.js']),
	// name of flash file
	flashName: 'flashmediaelement.swf',
	// streamer for RTMP streaming
	flashStreamer: '',
	// set to 'always' for CDN version
	flashScriptAccess: 'sameDomain',
	// turns on the smoothing filter in Flash
	enablePluginSmoothing: false,
	// enabled pseudo-streaming (seek) on .mp4 files
	enablePseudoStreaming: false,
	// start query parameter sent to server for pseudo-streaming
	pseudoStreamingStartQueryParam: 'start',
	// default if the <video width> is not specified
	defaultVideoWidth: 480,
	// default if the <video height> is not specified
	defaultVideoHeight: 270,
	// overrides <video width>
	pluginWidth: -1,
	// overrides <video height>
	pluginHeight: -1,
	// additional plugin variables in 'key=value' form
	pluginVars: [],
	// rate in milliseconds for Flash to fire the timeupdate event
	// larger number is less accurate, but less strain on plugin->JavaScript bridge
	timerRate: 250,
	// initial volume for player
	startVolume: 0.8,
	// custom error message in case media cannot be played; otherwise, Download File
	// link will be displayed
	customError: "",
	success: function () {
	},
	error: function () {
	}
};

/*
 Determines if a browser supports the <video> or <audio> element
 and returns either the native element or a Flash version that
 mimics HTML5 MediaElement
 */
mejs.MediaElement = function (el, o) {
	return mejs.HtmlMediaElementShim.create(el, o);
};

mejs.HtmlMediaElementShim = {

	create: function (el, o) {
		var
			options = {},
			htmlMediaElement = (typeof(el) == 'string') ? document.getElementById(el) : el,
			tagName = htmlMediaElement.tagName.toLowerCase(),
			src = htmlMediaElement.getAttribute('src'),
			poster = htmlMediaElement.getAttribute('poster'),
			autoplay = htmlMediaElement.getAttribute('autoplay'),
			preload = htmlMediaElement.getAttribute('preload'),
			controls = htmlMediaElement.getAttribute('controls'),
			playback,
			prop;

		// extend options
		for (prop in mejs.MediaElementDefaults) {
			options[prop] = mejs.MediaElementDefaults[prop];
		}
		for (prop in o) {
			options[prop] = o[prop];
		}


		// clean up attributes
		src = (typeof src == 'undefined' || src === null || src == '') ? null : src;
		poster = (typeof poster == 'undefined' || poster === null) ? '' : poster;
		preload = (typeof preload == 'undefined' || preload === null || preload === 'false') ? 'none' : preload;
		autoplay = !(typeof autoplay == 'undefined' || autoplay === null || autoplay === 'false');
		controls = !(typeof controls == 'undefined' || controls === null || controls === 'false');

		// test for HTML5 and plugin capabilities
		playback = this.determinePlayback(htmlMediaElement, src, options.playbackMethod);
		playback.url = (playback.url !== null) ? mejs.Utility.absolutizeUrl(playback.url) : '';

		if (playback.method == 'native') {
			// second fix for android
			if (mejs.MediaFeatures.isBustedAndroid) {
				htmlMediaElement.src = playback.url;
				htmlMediaElement.addEventListener('click', function () {
					htmlMediaElement.play();
				}, false);
			}

			// add methods to native HTMLMediaElement
			return this.updateNative(playback, options, autoplay, preload);
		} else {
			return this.createPlugin(playback, options, poster, autoplay, preload, controls);
		}
	},

	determinePlayback: function(htmlMediaElement, src, method){
		return {
			htmlMediaElement: htmlMediaElement,
			method: method,
			url: src
		}
	},

	createPlugin: function (playback, options, poster, autoplay, preload, controls) {
		var
			htmlMediaElement = playback.htmlMediaElement,
			width = 1,
			height = 1,
			pluginid = 'me_' + playback.method + '_' + (mejs.meIndex++),
			pluginMediaElement = new mejs.PluginMediaElement(pluginid, playback.method, playback.url),
			container = document.createElement('div'),
			specialIEContainer,
			node,
			initVars;

		// copy tagName from html media element
		pluginMediaElement.tagName = htmlMediaElement.tagName;

		// copy attributes from html media element to plugin media element
		for (var i = 0; i < htmlMediaElement.attributes.length; i++) {
			var attribute = htmlMediaElement.attributes[i];
			if (attribute.specified) {
				pluginMediaElement.setAttribute(attribute.name, attribute.value);
			}
		}

		// check for placement inside a <p> tag (sometimes WYSIWYG editors do this)
		node = htmlMediaElement.parentNode;

		while (node !== null && node.tagName != null && node.tagName.toLowerCase() !== 'body' &&
		node.parentNode != null && node.parentNode.tagName != null && node.parentNode.constructor != null && node.parentNode.constructor.name === "ShadowRoot") {
			if (node.parentNode.tagName.toLowerCase() === 'p') {
				node.parentNode.parentNode.insertBefore(node, node.parentNode);
				break;
			}
			node = node.parentNode;
		}

		width = (options.pluginWidth > 0) ? options.pluginWidth : (options.videoWidth > 0) ? options.videoWidth : (htmlMediaElement.getAttribute('width') !== null) ? htmlMediaElement.getAttribute('width') : options.defaultVideoWidth;
		height = (options.pluginHeight > 0) ? options.pluginHeight : (options.videoHeight > 0) ? options.videoHeight : (htmlMediaElement.getAttribute('height') !== null) ? htmlMediaElement.getAttribute('height') : options.defaultVideoHeight;

		// in case of '%' make sure it's encoded
		width = mejs.Utility.encodeUrl(width);
		height = mejs.Utility.encodeUrl(height);


		// register plugin
		pluginMediaElement.success = options.success;

		// add container (must be added to DOM before inserting HTML for IE)
		container.className = 'th-me-plugin';
		container.id = pluginid + '_container';

		htmlMediaElement.parentNode.insertBefore(container, htmlMediaElement);

		if (playback.method === 'flash') {
			var canPlayVideo = htmlMediaElement.getAttribute('type') === 'audio/mp4',
				childrenSources = htmlMediaElement.getElementsByTagName('source');

			if (childrenSources && !canPlayVideo) {
				for (var i = 0, total = childrenSources.length; i < total; i++) {
					if (childrenSources[i].getAttribute('type') === 'audio/mp4') {
						canPlayVideo = true;
					}
				}
			}

			// flash vars
			initVars = [
				'id=' + pluginid,
				'isvideo=' + "true",
				'autoplay=' + ((autoplay) ? "true" : "false"),
				'preload=' + preload,
				'width=' + width,
				'startvolume=' + options.startVolume,
				'timerrate=' + options.timerRate,
				'flashstreamer=' + options.flashStreamer,
				'height=' + height,
				'pseudostreamstart=' + options.pseudoStreamingStartQueryParam];

			if (playback.url !== null) {
				if (playback.method == 'flash') {
					initVars.push('file=' + mejs.Utility.encodeUrl(playback.url));
				} else {
					initVars.push('file=' + playback.url);
				}
			}
			if (options.enablePluginDebug) {
				initVars.push('debug=true');
			}
			if (options.enablePluginSmoothing) {
				initVars.push('smoothing=true');
			}
			if (options.enablePseudoStreaming) {
				initVars.push('pseudostreaming=true');
			}
			if (controls) {
				initVars.push('controls=true'); // shows controls in the plugin if desired
			}
			if (options.pluginVars) {
				initVars = initVars.concat(options.pluginVars);
			}

			// call from plugin
			window[pluginid + '_init'] = function () {
				switch (pluginMediaElement.pluginType) {
					case 'flash':
						pluginMediaElement.pluginElement = pluginMediaElement.pluginApi = document.getElementById(pluginid);
						break;
				}

				if (pluginMediaElement.pluginApi != null && pluginMediaElement.success) {
					pluginMediaElement.success(pluginMediaElement, htmlMediaElement);
				}
			};

			// event call from plugin
			window[pluginid + '_event'] = function (eventName, values) {

				var
					e,
					i,
					bufferedTime;

				// fake event object to mimic real HTML media event.
				e = {
					type: eventName,
					target: pluginMediaElement
				};

				// attach all values to element and event object
				for (i in values) {
					pluginMediaElement[i] = values[i];
					e[i] = values[i];
				}

				// fake the newer W3C buffered TimeRange (loaded and total have been removed)
				bufferedTime = values.bufferedTime || 0;

				e.target.buffered = e.buffered = {
					start: function (index) {
						return 0;
					},
					end: function (index) {
						return bufferedTime;
					},
					length: 1
				};

				pluginMediaElement.dispatchEvent(e);
			}


		}

		switch (playback.method) {
			case 'flash':
				if (mejs.MediaFeatures.isIE) {
					specialIEContainer = document.createElement('div');
					container.appendChild(specialIEContainer);
					specialIEContainer.outerHTML =
						'<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="//download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab" ' +
						'id="' + pluginid + '" width="' + width + '" height="' + height + '" class="th-media-shim">' +
						'<param name="movie" value="' + options.pluginPath + options.flashName + '?' + (new Date().getTime()) + '" />' +
						'<param name="flashvars" value="' + initVars.join('&amp;') + '" />' +
						'<param name="quality" value="high" />' +
						'<param name="bgcolor" value="#000000" />' +
						'<param name="wmode" value="transparent" />' +
						'<param name="allowScriptAccess" value="' + options.flashScriptAccess + '" />' +
						'<param name="allowFullScreen" value="true" />' +
						'<param name="scale" value="default" />' +
						'</object>';
				} else {
					container.innerHTML =
						'<embed id="' + pluginid + '" name="' + pluginid + '" ' +
						'play="true" ' +
						'loop="false" ' +
						'quality="high" ' +
						'bgcolor="#000000" ' +
						'wmode="transparent" ' +
						'allowScriptAccess="' + options.flashScriptAccess + '" ' +
						'allowFullScreen="true" ' +
						'type="application/x-shockwave-flash" pluginspage="//www.macromedia.com/go/getflashplayer" ' +
						'src="' + options.pluginPath + options.flashName + '" ' +
						'flashvars="' + initVars.join('&') + '" ' +
						'width="' + width + '" ' +
						'height="' + height + '" ' +
						'scale="default"' +
						'class="th-media-shim"></embed>';
				}
				break;
		}
		// hide original element
		htmlMediaElement.style.display = 'none';
		// prevent browser from autoplaying when using a plugin
		htmlMediaElement.removeAttribute('autoplay');
		return pluginMediaElement;
	},

	updateNative: function (playback, options) {
		var htmlMediaElement = playback.htmlMediaElement, m;
		// add methods to video object to bring it into parity with Flash Object
		for (m in mejs.HtmlMediaElement) {
			htmlMediaElement[m] = mejs.HtmlMediaElement[m];
		}
		// fire success code
		options.success(htmlMediaElement, htmlMediaElement);

		return htmlMediaElement;
	}
};

window.mejs = mejs;
window.MediaElement = mejs.MediaElement;
