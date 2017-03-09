/**
 * Postroll plugin
 */
(function($) {

	$.extend(mejs.MepDefaults, {
		postrollCloseText: ''
	});

	// Postroll
	$.extend(MediaElementPlayer.prototype, {
		buildpostroll: function(player, controls, layers, media) {
			var
				t = this,
				postrollTitle = t.options.postrollCloseText ? t.options.postrollCloseText : mejs.i18n.t('mejs.close'),
				postrollLink = t.container.find('link[rel="postroll"]').attr('href');

			if (typeof postrollLink !== 'undefined') {
				player.postroll =
					$('<div class="th-media-postroll-layer th-media-layer"><a class="th-media-postroll-close" onclick="$(this).parent().hide();return false;">' + postrollTitle + '</a><div class="th-media-postroll-layer-content"></div></div>').prependTo(layers).hide();

				t.media.addEventListener('ended', function (e) {
					$.ajax({
						dataType: 'html',
						url: postrollLink,
						success: function (data, textStatus) {
							layers.find('.th-media-postroll-layer-content').html(data);
						}
					});
					player.postroll.show();
				}, false);
			}
		}
	});

})(mejs.$);
