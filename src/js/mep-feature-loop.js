(function($) {
	// loop toggle
	$.extend(MediaElementPlayer.prototype, {
		buildloop: function(player, controls, layers, media) {
			var
				t = this,
				// create the loop button
				loop =
				$('<div class="th-media-button th-media-loop-button ' + ((player.options.loop) ? 'th-media-loop-on' : 'th-media-loop-off') + '">' +
					'<button type="button" aria-controls="' + t.id + '" title="Toggle Loop" aria-label="Toggle Loop"></button>' +
				'</div>')
				// append it to the toolbar
				.appendTo(controls)
				// add a click toggle event
				.click(function() {
					player.options.loop = !player.options.loop;
					if (player.options.loop) {
						loop.removeClass('th-media-loop-off').addClass('th-media-loop-on');
					} else {
						loop.removeClass('th-media-loop-on').addClass('th-media-loop-off');
					}
				});
		}
	});

})(mejs.$);
