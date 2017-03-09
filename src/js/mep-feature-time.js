(function($) {

	// options
	$.extend(mejs.MepDefaults, {
		duration: -1,
		timeAndDurationSeparator: '<span> | </span>'
	});


	// current and duration 00:00 / 00:00
	$.extend(MediaElementPlayer.prototype, {
		buildcurrent: function(player, controls, layers, media) {
			var t = this;

			$('<div class="th-media-time" role="timer" aria-live="off">' +
					'<span class="th-media-currenttime">' +
						mejs.Utility.secondsToTimeCode(0, player.options) +
                    '</span>'+
				'</div>')
			.appendTo(controls);

			t.currenttime = t.controls.find('.th-media-currenttime');

			media.addEventListener('timeupdate',function() {
				if (t.controlsAreVisible) {
					player.updateCurrent();
				}

			}, false);
		},


		buildduration: function(player, controls, layers, media) {
			var t = this;

			if (controls.children().last().find('.th-media-currenttime').length > 0) {
				$(t.options.timeAndDurationSeparator +
					'<span class="th-media-duration">' +
						mejs.Utility.secondsToTimeCode(t.options.duration, t.options) +
					'</span>')
					.appendTo(controls.find('.th-media-time'));
			} else {

				// add class to current time
				controls.find('.th-media-currenttime').parent().addClass('th-media-currenttime-container');

				$('<div class="th-media-time th-media-duration-container">'+
					'<span class="th-media-duration">' +
						mejs.Utility.secondsToTimeCode(t.options.duration, t.options) +
					'</span>' +
				'</div>')
				.appendTo(controls);
			}

			t.durationD = t.controls.find('.th-media-duration');

			media.addEventListener('timeupdate',function() {
				if (t.controlsAreVisible) {
					player.updateDuration();
				}
			}, false);
		},

		updateCurrent:  function() {
			var t = this;

			var currentTime = t.media.currentTime;

			if (isNaN(currentTime)) {
				currentTime = 0;
			}

			if (t.currenttime) {
				t.currenttime.html(mejs.Utility.secondsToTimeCode(currentTime, t.options));
			}
		},

		updateDuration: function() {
			var t = this;

			var duration = t.media.duration;
			if (t.options.duration > 0) {
				duration = t.options.duration;
			}

			if (isNaN(duration)) {
				duration = 0;
			}

			//Toggle the long video class if the video is longer than an hour.
			t.container.toggleClass("th-media-long-video", duration > 3600);

			if (t.durationD && duration > 0) {
				t.durationD.html(mejs.Utility.secondsToTimeCode(duration, t.options));
			}
		}
	});

})(mejs.$);
