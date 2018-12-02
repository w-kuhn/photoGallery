$(function  () {
	var gallery;
	var templater;
	var templates = {};
	var FADE_TIME = 500;

	templater = {
		cacheTemplates: function () {
			$("script[type='text/x-handlebars']").each(function () {
				var $template = $(this);
				templates[$template.attr('id')] = Handlebars.compile($template.html());
			});

			this.registerPartials();
		},
		registerPartials: function () {
			$('[data-type=partial]').each(function () {
				var $partial = $(this);
				Handlebars.registerPartial($partial.attr('id'), $partial.html());
			});
		},
		init: function () {
			this.cacheTemplates();
		},
	};

	gallery = {
		getPhotos: function () {
			$.ajax({
				method: 'GET',
				url: '/photos',
				dataType: 'json',
				success: function (json) {
					this.photos = json;
					this.renderPhotos();
					this.renderPhotoInformation(1);
					this.loadCommentsFor(1);
				}.bind(this),
			});
		},
		renderPhotos: function () {
			$('#slides').html(templates.photos({ photos: this.photos }));
		},
		renderPhotoInformation: function (id) {
			$("[name=photo_id]").val(id);
			var photo = this.photos.find(function (photo) { return photo.id === id });
			$('section header').html(templates.photo_information(photo));
		},
		loadCommentsFor: function (id) {
			var comments;

			$.ajax({
				method: 'GET',
				url: '/comments',
				data: 'photo_id=' + id,
				dataType: 'json',
				success: function (json) {
					comments = json;
					$('#comments ul').html(templates.comments({ comments: json }));
				},
			});
		},
		changePhoto: function (e) {
			e.preventDefault();
			var direction = $(e.target).is('.prev') ? 'prev' : 'next';
			var $slides = $('#slides figure');
			var currentSlide = $('#slides figure:visible').fadeOut(FADE_TIME);
			var nextSlide = currentSlide[direction]();

			if (nextSlide.length === 0) { 
				nextSlide = (direction === 'prev') ? $slides.last() : $slides.first();
			}
			nextSlide.delay(FADE_TIME).fadeIn(FADE_TIME);

			this.renderPhotoInformation(+nextSlide.attr("data-id"));
			this.loadCommentsFor(nextSlide.attr("data-id"));
		},
		updateCount: function (e) {
			e.preventDefault();
			var currentPhoto = this.photos[$('#slides').find('figure:visible').index()];

			$.ajax({
				method: 'POST',
				url: $(e.target).attr('href'),
				data: 'photo_id=' + $(e.target).attr("data-id"),
				success: function (json) {
					var buttonText = $(e.target).text().replace(/\d+/, json.total);
					$(e.target).text(buttonText);
					currentPhoto[$(e.target).attr('data-property')] = json.total;
				},	
			});
		},
		renderComment: function (e) {
			e.preventDefault();
			var $form = $(this);
			
			$.ajax({
				method: $form.attr('method'),
				url: $form.attr('action'),
				data: $form.serializeArray(),
				success: function (json) {
					$('#comments ul').append(templates.comment(json));
					$form[0].reset();
				},
			});
		},
		bindEvents: function () {
			$('#slideshow a').on('click', this.changePhoto.bind(this));
			$('section > header').on('click', '.actions a', this.updateCount.bind(this));
			$('form').on('submit', this.renderComment);
		},
		init: function () {
			this.bindEvents();
			this.templater = templater.init();
			this.getPhotos();
		},
	};
	gallery.init();
});
