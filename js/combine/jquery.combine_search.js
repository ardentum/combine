(function($) {

$.widget("combine.search", {
	options: {
		source: [],
		extraParams: {},
		caching: true
	},

	_create: function() {
		if(this.options.caching) {
			this.cache = {};
		}

		this._initRequest();
		this._bindEvents();
	},

	// Selects the requestFunction according to the source data
	_initRequest: function() {
		if($.isArray(this.options.source)) {
			this._requestFunction = $.combine.search.arrayRequest;
		} else if(typeof this.options.source === "string") {
			this._requestFunction = $.combine.search.ajaxRequest;
		} else if(typeof this.options.source === "function") {
			this._requestFunction = this.options.source;
		}
	},

	// Binds handlers to the DOM and COMBINE events
	_bindEvents: function() {
		var widget = this,
			$input = widget.element;

		$input.bind({
			"combine_search.combine_search": function(event, ui) {
				widget.search(ui.term, ui.extraParams);
			},

			"combine_check.combine_search": function(event, ui) {
				widget.check(ui.value, ui.state);
			},

			"combine_select.combine_search": function() {
				if(typeof widget.ajax !== "undefined") {
					widget.ajax.abort();
				}
			}
		});
	},

	// Sends a request via _requestFunction and resolve/reject deferred object.
	// Caches request results if cache option is turned on
	_request: function(term, extraParams, isExactMatch) {
		var widget = this,
			state = $.Deferred();

		extraParams = extraParams || {};

		if(widget.options.caching && !isExactMatch && widget.cache[term]) {
			state.resolve($.merge([], widget.cache[term]));
		} else {
			$.when(widget._requestFunction.apply(widget, arguments)).done(function(result) {
				var normalizedResult,
					defaultItem;

				if(widget.combine.options.allowDefault && term === "") {
					defaultItem = widget.combine._normalize(widget.options.defaultItem);
					defaultItem._default = true;
					result.splice(0, 0, defaultItem);
				}

				normalizedResult = $.map(result, widget.combine._normalize);

				if(!isExactMatch && widget.options.caching) {
					widget.cache[term] = normalizedResult;
				}

				state.resolve($.merge([], normalizedResult));
			});
		}

		return state;
	},

	// Makes request and triggers combine_response event with results data
	search: function(term, extraParams) {
		var widget = this;

		if(widget.options.disabled) {
			return;
		}

		$.when(widget._request(term, extraParams)).done(function(result) {
			widget.combine.response(result, term);
		});
	},

	// Checks value via request and then changes STATE deferred object
	check: function(value, state) {
		if(this.combine.selected && this.combine.selected.label === value) {
			state.resolve(this.combine.selected);
			return state;
		}

		$.when(this._request(value, {}, true)).done(function(data) {
			(data.length == 1) ? state.resolve(data[0]) : state.reject();
		});

		return state;
	},

	destroy: function() {
		this.element.unbind(".combine_search");
		$.Widget.prototype.destroy.call(this);
	}
});

$.extend($.combine.search, {
	escapeRegex: function(value) {
		return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	},

	arrayRequest: function(term, extraParams, isExactMatch) {
		var widget = this,
			pattern = $.combine.search.escapeRegex(term);

		pattern = isExactMatch ? ("^" + pattern + "$") : pattern;

		return $.Deferred().resolve($.grep(widget.options.source, function(item) {
			return new RegExp(pattern, "i").test(item.label || item.value || item);
		}));
	},

	ajaxRequest: function(term, extraParams, isExactMatch) {
		var widget = this,
			FORCED_REQUEST_LIMIT = 200,
			requestData = $.extend({
				term: term,
				is_exact_match: isExactMatch ? 1 : 0
			}, widget.options.extraParams, extraParams);

		widget.requestIndex = widget.requestIndex || 1;

		if(requestData.isForced) {
			requestData.limit = FORCED_REQUEST_LIMIT;
		}

		if(typeof widget.ajax !== "undefined") {
			widget.ajax.abort();
		}

		widget.ajax = $.ajax({
			url: widget.options.source,
			data: requestData,
			dataType: "json",
			autocompleteRequest: ++widget.requestIndex
		});

		return widget.ajax;
	}
});

})(jQuery);