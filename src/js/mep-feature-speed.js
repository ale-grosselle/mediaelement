(function($) {

	// Speed
	$.extend(mejs.MepDefaults, {

		// We also support to pass object like this:
		// [{name: 'Slow', value: '0.75'}, {name: 'Normal', value: '1.00'}, ...]
		speeds: ['2.00', '1.50', '1.25', '1.00', '0.75'],

		defaultSpeed: '1.00',

		speedChar: 'x'

	});

	$.extend(MediaElementPlayer.prototype, {

		buildspeed: function(player, controls, layers, media) {
			var t = this;

			if (t.media.pluginType == 'native') {
				var
					speedButton = null,
					speedSelector = null,
					playbackSpeed = null,
					inputId = null;

				var speeds = [];
				var defaultInArray = false;
				for (var i=0, len=t.options.speeds.length; i < len; i++) {
					var s = t.options.speeds[i];
					if (typeof(s) === 'string'){
						speeds.push({
							name: s + t.options.speedChar,
							value: s
						});
						if(s === t.options.defaultSpeed) {
							defaultInArray = true;
						}
					}
					else {
						speeds.push(s);
						if(s.value === t.options.defaultSpeed) {
							defaultInArray = true;
						}
					}
				}

				if (!defaultInArray) {
					speeds.push({
						name: t.options.defaultSpeed + t.options.speedChar,
						value: t.options.defaultSpeed
					});
				}

				speeds.sort(function(a, b) {
					return parseFloat(b.value) - parseFloat(a.value);
				});

				var getSpeedNameFromValue = function(value) {
					for(i=0,len=speeds.length; i <len; i++) {
						if (speeds[i].value === value) {
							return speeds[i].name;
						}
					}
				};

				var html = '<div class="th-media-button th-media-speed-button">' +
							'<button type="button">' + getSpeedNameFromValue(t.options.defaultSpeed) + '</button>' +
							'<div class="th-media-speed-selector">' +
							'<ul>';

				for (i = 0, il = speeds.length; i<il; i++) {
					inputId = t.id + '-speed-' + speeds[i].value;
					html += '<li>' +
								'<input type="radio" name="speed" ' +
											'value="' + speeds[i].value + '" ' +
											'id="' + inputId + '" ' +
											(speeds[i].value === t.options.defaultSpeed ? ' checked' : '') +
											' />' +
								'<label for="' + inputId + '" ' +
											(speeds[i].value === t.options.defaultSpeed ? ' class="th-media-speed-selected"' : '') +
											'>' + speeds[i].name + '</label>' +
							'</li>';
				}
				html += '</ul></div></div>';

				speedButton = $(html).appendTo(controls);
				speedSelector = speedButton.find('.th-media-speed-selector');

				playbackSpeed = t.options.defaultSpeed;

				media.addEventListener('loadedmetadata', function(e) {
					if (playbackSpeed) {
						media.playbackRate = parseFloat(playbackSpeed);
					}
				}, true);

				speedSelector
					.on('click', 'input[type="radio"]', function() {
						var newSpeed = $(this).attr('value');
						playbackSpeed = newSpeed;
						media.playbackRate = parseFloat(newSpeed);
						speedButton.find('button').html(getSpeedNameFromValue(newSpeed));
						speedButton.find('.th-media-speed-selected').removeClass('th-media-speed-selected');
						speedButton.find('input[type="radio"]:checked').next().addClass('th-media-speed-selected');
					});
				speedButton
					.one( 'mouseenter focusin', function() {
						speedSelector
							.height(
								speedButton.find('.th-media-speed-selector ul').outerHeight(true) +
								speedButton.find('.th-media-speed-translations').outerHeight(true))
							.css('top', (-1 * speedSelector.height()) + 'px');
					});
			}
		}
	});

})(mejs.$);
