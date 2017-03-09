(function($) {

	$.extend(mejs.MepDefaults, {
		playText: '',
		pauseText: ''
	});


	// PLAY/pause BUTTON
	$.extend(MediaElementPlayer.prototype, {
		buildplaypause: function(player, controls, layers, media) {
			var
				t = this,
				op = t.options,
				playTitle = op.playText ? op.playText : mejs.i18n.t('mejs.play'),
				pauseTitle = op.pauseText ? op.pauseText : mejs.i18n.t('mejs.pause'),
				play =
				$('<div class="th-media-button th-media-playpause-button th-media-play" >' +
					'<button type="button" aria-controls="' + t.id + '" title="' + playTitle + '" aria-label="' + pauseTitle + '"></button>' +
				'</div>')
				.appendTo(controls)
				.click(function(e) {
					e.preventDefault();

					if (media.paused) {
						media.play();
					} else {
						media.pause();
					}

					return false;
				}),
				play_btn = play.find('button');


			function togglePlayPause(which) {
				if ('play' === which) {
					play.removeClass('th-media-play').addClass('th-media-pause');
					play_btn.attr({
						'title': pauseTitle,
						'aria-label': pauseTitle
					});
				} else {
					play.removeClass('th-media-pause').addClass('th-media-play');
					play_btn.attr({
						'title': playTitle,
						'aria-label': playTitle
					});
				}
			};
			togglePlayPause('pse');


			media.addEventListener('play',function() {
				togglePlayPause('play');
			}, false);
			media.addEventListener('playing',function() {
				togglePlayPause('play');
			}, false);


			media.addEventListener('pause',function() {
				togglePlayPause('pse');
			}, false);
			media.addEventListener('paused',function() {
				togglePlayPause('pse');
			}, false);
		}
	});

})(mejs.$);
