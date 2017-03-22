(function ($) {

	// default player values
	mejs.MepDefaults = {
		// url to poster (to fix iOS 3.x)
		poster: '',
		// When the video is ended, we can show the poster.
		showPosterWhenEnded: false,
		// default if the <video width> is not specified
		defaultVideoWidth: 480,
		// default if the <video height> is not specified
		defaultVideoHeight: 270,
		// if set, overrides <video width>
		videoWidth: -1,
		// if set, overrides <video height>
		videoHeight: -1,
		// default amount to move back when back key is pressed
		//Flash or Html5?
		playbackMethod: 'native',

		defaultSeekBackwardInterval: function (media) {
			return (media.duration * 0.05);
		},
		// default amount to move forward when forward key is pressed
		defaultSeekForwardInterval: function (media) {
			return (media.duration * 0.05);
		},
		// set dimensions via JS instead of CSS
		setDimensions: true,
		// useful for <audio> player loops
		loop: false,
		// rewind to beginning when media ends
		autoRewind: true,
		// resize to media dimensions
		enableAutosize: false,
		// Enable click video element to toggle play/pause
		clickToPlayPause: true,
		// force iPad's native controls
		iPadUseNativeControls: false,
		// force iPhone's native controls
		iPhoneUseNativeControls: false,
		// force Android's native controls
		AndroidUseNativeControls: false,
		// features to show
		features: ['fullscreen'],
		// only for dynamic
		isVideo: true,
		// when this player starts, it will pause other players
		pauseOtherPlayers: true
	};

	mejs.mepIndex = 0;

	mejs.players = {};

	// wraps a MediaElement object in player controls
	mejs.MediaElementPlayer = function (node, o) {
		// enforce object, even without "new" (via John Resig)
		if (!(this instanceof mejs.MediaElementPlayer)) {
			return new mejs.MediaElementPlayer(node, o);
		}

		var t = this;

		// these will be reset after the MediaElement.success fires
		t.$media = t.$node = $(node);
		t.node = t.media = t.$media[0];

		if (!t.node) {
			return;
		}

		// check for existing player
		if (typeof t.node.player != 'undefined') {
			return t.node.player;
		}


		// try to get options from data-mejsoptions
		if (typeof o == 'undefined') {
			o = t.$node.data('mejsoptions');
		}

		// extend default options
		t.options = $.extend({}, mejs.MepDefaults, o);

		// unique ID
		t.id = 'th-video_' + mejs.mepIndex++;

		// add to player array (for focus events)
		mejs.players[t.id] = t;

		// start up
		t.init();

		return t;
	};

	// actual player
	mejs.MediaElementPlayer.prototype = {

		hasFocus: false,

		init: function () {

			var
				t = this,
				mf = mejs.MediaFeatures,
			// options for MediaElement (shim)
				meOptions = $.extend(true, {}, t.options, {
					success: function (media, domNode) {
						t.meReady(media, domNode);
					},
					error: function (e) {
						t.handleError(e);
					}
				}),
				tagName = t.media.tagName.toLowerCase();

			t.isDynamic = (tagName !== 'audio' && tagName !== 'video');

			if (t.isDynamic) {
				// get video from src or href?
				t.isVideo = t.options.isVideo;
			} else {
				t.isVideo = (tagName !== 'audio' && t.options.isVideo);
			}

			// use native controls in iPad, iPhone, and Android
			if ((mf.isiPad && t.options.iPadUseNativeControls) || (mf.isiPhone && t.options.iPhoneUseNativeControls)) {

				// add controls and stop
				t.$media.attr('controls', 'controls');

				// attempt to fix iOS 3 bug
				//t.$media.removeAttr('poster');
				// no Issue found on iOS3 -ttroxell

				// override Apple's autoplay override for iPads
				if (mf.isiPad && t.media.getAttribute('autoplay') !== null) {
					t.play();
				}

			} else if (mf.isAndroid && t.options.AndroidUseNativeControls) {
				// leave default player
			} else {

				// DESKTOP: use MediaElementPlayer controls

				// remove native controls
				t.$media.removeAttr('controls');
				// build container
				t.container =
					$('<div id="' + t.id + '" class="th-video-wrapper ' +
						'" tabindex="0"' + '">' +
						'<div class="th-video-inner">' +
						'<div class="th-video-element"></div>' +
						'<div class="th-poster-element"></div>' +
						'<div class="th-video-clear"></div>' +
						'</div>' +
						'</div>')
						.addClass(t.$media[0].className)
						.insertBefore(t.$media);

				// add classes for user and content
				t.container.addClass(
					(mf.isAndroid ? 'th-video-android ' : '') +
					(mf.isiOS ? 'th-video-ios ' : '') +
					(mf.isiPad ? 'th-video-ipad ' : '') +
					(mf.isiPhone ? 'th-video-iphone ' : '')
				);


				// move the <video/video> tag into the right spot
				t.container.find('.th-video-element').append(t.$media);

				// needs to be assigned here, after iOS remap
				t.node.player = t;

				// find parts
				/*t.controls = t.container.find('.th-media-controls');*/
				//t.layers = t.container.find('.th-media-layers');

				// determine the size

				/* size priority:
				 (1) videoWidth (forced),
				 (2) style="width;height;"
				 (3) width attribute,
				 (4) defaultVideoWidth (for unspecified cases)
				 */

				var tagType = ('video');
				var capsTagName = tagType.substring(0, 1).toUpperCase() + tagType.substring(1);


				if (t.options[tagType + 'Width'] > 0 || t.options[tagType + 'Width'].toString().indexOf('%') > -1) {
					t.width = t.options[tagType + 'Width'];
				} else if (t.media.style.width !== '' && t.media.style.width !== null) {
					t.width = t.media.style.width;
				} else if (t.media.getAttribute('width') !== null) {
					t.width = t.$media.attr('width');
				} else {
					t.width = t.options['default' + capsTagName + 'Width'];
				}

				if (t.options[tagType + 'Height'] > 0 || t.options[tagType + 'Height'].toString().indexOf('%') > -1) {
					t.height = t.options[tagType + 'Height'];
				} else if (t.media.style.height !== '' && t.media.style.height !== null) {
					t.height = t.media.style.height;
				} else if (t.$media[0].getAttribute('height') !== null) {
					t.height = t.$media.attr('height');
				} else {
					t.height = t.options['default' + capsTagName + 'Height'];
				}

				// set the size, while we wait for the plugins to load below
				t.setPlayerSize(t.width, t.height);

				// create MediaElementShim
				meOptions.pluginWidth = t.width;
				meOptions.pluginHeight = t.height;
			}

			// create MediaElement shim
			mejs.MediaElement(t.$media[0], meOptions);
		},

		// Sets up all controls and events
		meReady: function (media, domNode) {
			var
				t = this,
				mf = mejs.MediaFeatures,
				autoplayAttr = domNode.getAttribute('autoplay'),
				autoplay = !(typeof autoplayAttr == 'undefined' || autoplayAttr === null || autoplayAttr === 'false');

			// make sure it can't create itself again if a plugin reloads
			if (t.created) {
				return;
			} else {
				t.created = true;
			}

			t.media = media;
			t.domNode = domNode;

			if (!(mf.isAndroid && t.options.AndroidUseNativeControls) && !(mf.isiPad && t.options.iPadUseNativeControls) && !(mf.isiPhone && t.options.iPhoneUseNativeControls)) {
				// two built in features
				t.buildposter(t, t.container, t.media);
				// reset all layers and controls
				t.setPlayerSize(t.width, t.height);

				// controls fade
				if (!mejs.MediaFeatures.hasTouch) {
					// create callback here since it needs access to current
					// MediaElement object
					t.clickToPlayPauseCallback = function () {
						if (t.options.clickToPlayPause) {
							if (t.media.paused) {
								t.play();
							} else {
								t.pause();
							}
						}
					};
					// click to play/pause
					t.media.addEventListener('click', t.clickToPlayPauseCallback, false);
				}

				// force autoplay for all
				if (autoplay) {
					t.play();
				}

				// resizer
				if (t.options.enableAutosize) {
					t.media.addEventListener('loadedmetadata', function (e) {
						// if the <video height> was not set and the options.videoHeight was not set
						// then resize to the real dimensions
						if (t.options.videoHeight <= 0 && t.domNode.getAttribute('height') === null && !isNaN(e.target.videoHeight)) {
							t.setPlayerSize(e.target.videoWidth, e.target.videoHeight);
							t.media.setVideoSize(e.target.videoWidth, e.target.videoHeight);
						}
					}, false);
				}

				// EVENTS
				// FOCUS: when a video starts playing, it takes focus from other players (possibly pausing them)
				t.media.addEventListener('play', function () {
					var playerIndex;
					// go through all other players
					for (playerIndex in mejs.players) {
						var p = mejs.players[playerIndex];
						if (p.id != t.id && t.options.pauseOtherPlayers && !p.paused && !p.ended) {
							p.pause();
						}
						p.hasFocus = false;
					}
					t.hasFocus = true;
				}, false);

				// ended for all
				t.media.addEventListener('ended', function (e) {
					if (t.options.autoRewind) {
						try {
							t.media.setCurrentTime(0);
						} catch (exp) {}
					}
					t.media.pause();
					if (t.options.loop) {
						t.play();
					}
				}, false);

				// resize on the first play
				t.media.addEventListener('loadedmetadata', function () {
					if (!t.isFullScreen) {
						t.setPlayerSize(t.width, t.height);
					}
				}, false);
			}

			if (t.options.success) {
				if (typeof t.options.success == 'string') {
					window[t.options.success](t.media, t.domNode, t);
				} else {
					t.options.success(t.media, t.domNode, t);
				}
			}
		},

		handleError: function (e) {
			var t = this;
			// Tell user that the file cannot be played
			if (t.options.error) {
				t.options.error(e);
			}
		},
		setPlayerSize: function (width, height) {
			var t = this;
			if (!t.options.setDimensions) {
				return false;
			}
			if (typeof width != 'undefined') {
				t.width = width;
			}
			if (typeof height != 'undefined') {
				t.height = height;
			}
			// check stretching modes
			this.setDimensions(t.width, t.height);
		},
		hasFluidMode: function () {
			var t = this;

			// detect 100% mode - use currentStyle for IE since css() doesn't return percentages
			return (t.height.toString().indexOf('%') > 0 || (t.$node.css('max-width') !== 'none' && t.$node.css('max-width') !== 't.width') || (t.$node[0].currentStyle && t.$node[0].currentStyle.maxWidth === '100%'));
		},
		setDimensions: function (width, height) {
			var t = this;
			t.container
				.width(width)
				.height(height);
		},
		buildposter: function (player, mainContainer, media) {
			var t = this,
				poster =
					$('<div class="th-video-poster">' +
						'</div>')
						.appendTo(mainContainer.find(".th-poster-element")),
				posterUrl = player.$media.attr('poster');

			// prioriy goes to option (this is useful if you need to support iOS 3.x (iOS completely fails with poster)
			if (player.options.poster !== '') {
				posterUrl = player.options.poster;
			}

			// second, try the real poster
			if (posterUrl) {
				t.setPoster(posterUrl);
			} else {
				poster.hide();
			}

			media.addEventListener('play', function () {
				poster.hide();
			}, false);

			if (player.options.showPosterWhenEnded && player.options.autoRewind) {
				media.addEventListener('ended', function () {
					poster.show();
				}, false);
			}
		},
		hidePoster: function () {
			var t = this;
			t.container.find('.th-video-poster').hide();
		},
		showPoster: function () {
			var t = this;
			t.container.find('.th-video-poster').show();
		},
		setPoster: function (url) {
			var t = this,
				posterDiv = t.container.find('.th-video-poster'),
				posterImg = posterDiv.find('img');

			if (posterImg.length === 0) {
				posterImg = $('<img width="100%" height="100%" alt="" />').appendTo(posterDiv);
			}

			posterImg.attr('src', url);
			posterDiv.css({'background-image': 'url(' + url + ')'});
		},
		play: function () {
			if(this.media.pluginType !== 'native'){
				this.load();
			}
			this.media.play();
		},
		pause: function () {
			try {
				this.media.pause();
			} catch (e) {
			}
		},
		load: function () {
			if (!this.isLoaded) {
				this.media.load();
			}

			this.isLoaded = true;
		},
		setMuted: function (muted) {
			this.media.setMuted(muted);
		},
		setCurrentTime: function (time) {
			this.media.setCurrentTime(time);
		},
		getCurrentTime: function () {
			return this.media.currentTime;
		},
		setVolume: function (volume) {
			this.media.setVolume(volume);
		},
		getVolume: function () {
			return this.media.volume;
		},
		setSrc: function (src) {
			var t = this;
			t.media.setSrc(src);
		},
		remove: function () {
			var t = this, featureIndex, feature;
			// invoke features cleanup
			for (featureIndex in t.options.features) {
				feature = t.options.features[featureIndex];
				if (t['clean' + feature]) {
					try {
						t['clean' + feature](t);
					} catch (e) {
					}
				}
			}

			// grab video and put it back in place
			if (!t.isDynamic) {
				t.$media.prop('controls', true);
				// detach events from the video
				// TODO: detach event listeners better than this;
				//		 also detach ONLY the events attached by this plugin!
				t.$node.clone().insertBefore(t.container).show();
				t.$node.remove();
			} else {
				t.$node.insertBefore(t.container);
			}

			if (t.media.pluginType !== 'native') {
				t.media.remove();
			}

			// Remove the player from the mejs.players object so that pauseOtherPlayers doesn't blow up when trying to pause a non existance flash api.
			delete mejs.players[t.id];

			if (typeof t.container == 'object') {
				t.container.remove();
			}
			t.globalUnbind();
			delete t.node.player;
		},
		resetSize: function () {
			var t = this;
			// webkit has trouble doing this without a delay
			setTimeout(function () {
				//console.log("resetSize");
				t.setPlayerSize(t.width, t.height);
			}, 50);
		}
	};

	(function () {
		var rwindow = /^((after|before)print|(before)?unload|hashchange|message|o(ff|n)line|page(hide|show)|popstate|resize|storage)\b/;

		function splitEvents(events, id) {
			// add player ID as an event namespace so it's easier to unbind them all later
			var ret = {d: [], w: []};
			$.each((events || '').split(' '), function (k, v) {
				var eventname = v + '.' + id;
				if (eventname.indexOf('.') === 0) {
					ret.d.push(eventname);
					ret.w.push(eventname);
				}
				else {
					ret[rwindow.test(v) ? 'w' : 'd'].push(eventname);
				}
			});
			ret.d = ret.d.join(' ');
			ret.w = ret.w.join(' ');
			return ret;
		}

		mejs.MediaElementPlayer.prototype.globalBind = function (events, data, callback) {
			var t = this;
			var doc = t.node ? t.node.ownerDocument : document;

			events = splitEvents(events, t.id);
			if (events.d) $(doc).bind(events.d, data, callback);
			if (events.w) $(window).bind(events.w, data, callback);
		};

		mejs.MediaElementPlayer.prototype.globalUnbind = function (events, callback) {
			var t = this;
			var doc = t.node ? t.node.ownerDocument : document;

			events = splitEvents(events, t.id);
			if (events.d) $(doc).unbind(events.d, callback);
			if (events.w) $(window).unbind(events.w, callback);
		};
	})();

	// turn into jQuery plugin
	if (typeof $ != 'undefined') {
		$.fn.mediaelementplayer = function (options) {
			if (options === false) {
				this.each(function () {
					var player = $(this).data('mediaelementplayer');
					if (player) {
						player.remove();
					}
					$(this).removeData('mediaelementplayer');
				});
			}
			else {
				this.each(function () {
					$(this).data('mediaelementplayer', new mejs.MediaElementPlayer(this, options));
				});
			}
			return this;
		};
	}

	// push out to window
	window.MediaElementPlayer = mejs.MediaElementPlayer;

})(mejs.$);
