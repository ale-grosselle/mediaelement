(function($) {

	$.extend(mejs.MepDefaults, {
		stopText: 'Stop'
	});

	// STOP BUTTON
	$.extend(MediaElementPlayer.prototype, {
		buildstop: function(player, controls, layers, media) {
			var t = this;

			$('<div class="th-media-button th-media-stop-button th-media-stop">' +
					'<button type="button" aria-controls="' + t.id + '" title="' + t.options.stopText + '" aria-label="' + t.options.stopText + '"></button>' +
				'</div>')
				.appendTo(controls)
				.click(function() {
					if (!media.paused) {
						media.pause();
					}
					if (media.currentTime > 0) {
						media.setCurrentTime(0);
                        media.pause();
						controls.find('.th-media-time-current').width('0px');
						controls.find('.th-media-time-handle').css('left', '0px');
						controls.find('.th-media-time-float-current').html( mejs.Utility.secondsToTimeCode(0, player.options));
						controls.find('.th-media-currenttime').html( mejs.Utility.secondsToTimeCode(0, player.options));
						layers.find('.th-media-poster').show();
					}
				});
		}
	});

})(mejs.$);
