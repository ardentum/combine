(function($) {

$.widget("combine.tokens", {
	options: {},

	classes: {
		MULTIPLE: "ui-combine-multiple",
		FOCUS: "ui-state-focus",
		DISABLED: "ui-state-disabled",
		ITEM: "ui-combine-tokens-item",
		ITEM_TEXT: "ui-combine-tokens-item-text",
		ITEM_REMOVE: "ui-combine-tokens-item-remove"
	},

	_create: function() {
		var widget = this;

		if(widget.options.multiple) {
			widget._initContainer();
			widget._createTestDiv();
			widget.combine = widget.element.data("combine");
			widget.combine.options.posElement = widget.$container;
			widget.element.data("originalWidth", widget.element.width());
			widget._bindEvents();
		}
	},

	_initContainer: function() {
		var widget = this;

		widget.$container = widget.element.parent();
		widget.$container
			.width(widget.element.width())
			.addClass(widget.options.containerClass || "")
			.addClass(widget.classes.MULTIPLE);
	},

	_renderToken: function(item) {
		var $token = $("<div></div>")
			.data("item.combine_tokens", item)
			.addClass(this.classes.ITEM);

		$("<span></span>")
			.addClass(this.classes.ITEM_TEXT)
			.text(item.label)
			.appendTo($token);

		$("<span></span>")
			.addClass(this.classes.ITEM_REMOVE)
			.appendTo($token);

		return $token;
	},

	_bindEvents: function() {
		var widget = this;

		widget.element.bind({
			"combine_before_response.combine_tokens": function(event, ui) {
				widget._filterDuplicates(ui.result);
			},

			"combine_before_select.combine_tokens": function(event, ui) {
				return widget._checkDuplicate(ui.item);
			},

			"combine_select.combine_tokens": function(event, ui) {
				widget._add(ui.item);
			},

			"combine_deselect.combine_tokens": function(event, ui) {
				ui.$token.remove();
			},

			"combine_blur.combine_tokens": function() {
				widget.$container.removeClass(widget.classes.FOCUS);
			},

			"focus.combine_tokens": function() {
				if(!widget.combine.disabled) {
					widget.$container.addClass(widget.classes.FOCUS);
				}
			},

			"keydown.combine_tokens": function(event) {
				if(widget.element.val() !== "") {
					widget.blockNavigation = true;
					setTimeout(function() {
						widget.blockNavigation = false;
					}, widget.options.keydownDelay);
				}

				setTimeout(function() {
					widget._resizeInput();

					if(widget.element.val() === "") {
						switch(event.keyCode) {
							case $.ui.keyCode.LEFT:
								widget._move("prev");
								break;
							case $.ui.keyCode.RIGHT:
								widget._move("next");
								break;
							case $.ui.keyCode.BACKSPACE:
							case $.ui.keyCode.DELETE:
								break;
							default:
								widget._deactivate();
						}
					} else {
						widget._deactivate();
					}
				}, 0);
			},

			"keyup.combine_tokens": function(event) {
				if(widget.element.val() === "" && !widget.blockNavigation) {
					switch(event.keyCode) {
						case $.ui.keyCode.BACKSPACE:
							if(widget.$active) {
								var $toRemove = widget.$active;

								widget._deactivate();
								widget._remove($toRemove);
							} else {
								widget._move("prev");
							}
							break;
						case $.ui.keyCode.DELETE:
							if(widget.$active) {
								var $toRemove = widget.$active;

								widget._activate($toRemove.nextAll("." + widget.classes.ITEM).first());
								widget._remove($toRemove);
							}
							event.preventDefault();
							break;
					}
				}
			},

			"combine_disabled.combine_tokens": function(event, ui) {
				widget.$container.toggleClass(widget.classes.DISABLED, ui.switcher);
			}
		});

		widget.$container
			.delegate("." + widget.classes.ITEM_REMOVE, "click.combine_tokens", function() {
				widget._remove($(this).closest("." + widget.classes.ITEM));
				return false;
			})
			.bind({
				"click.combine_tokens": function() {
					widget.element.focus();
				}
			});
	},

	_add: function(item) {
		var widget = this;

		widget.element.val("");
		setTimeout(function() {
			widget.element.val("");
		}, 0);

		if(item.label !== "") {
			widget._renderToken(item).insertBefore(widget.element);
			widget._resizeInput();
		}
	},

	_move: function(direction) {
		var widget = this;

		if(!widget.$active) {
			widget._activate(widget.element[direction + "All"]("." + widget.classes.ITEM).first());
		} else {
			if(widget.options.ordered) {
				var $active = widget.$active;
				widget._deactivate();

				if(direction === "prev") {
					widget.element.after($active);
				} else {
					widget.element.before($active);
				}
			} else {
				widget._activate(widget.$active[direction + "All"]("." + widget.classes.ITEM).first());
			}
		}
	},

	_filterDuplicates: function(result) {
		var widget = this,
			added = {},
			newResult = [];

		widget.$container.find("." + widget.classes.ITEM).each(function() {
			added[$(this).find("." + widget.classes.ITEM_TEXT).text()] = true;
		});

		$.each(result, function(i, item) {
			if(item && !added[item.label]) {
				newResult.push(item);
			}
		});

		result.length = 0;
		Array.prototype.push.apply(result, newResult);
	},

	_checkDuplicate: function(item) {
		var widget = this,
			check = true;

		widget.$container.find("." + widget.classes.ITEM).each(function() {
			if($(this).find("." + widget.classes.ITEM_TEXT).text() === item.label) {
				check = false;
			}
		});

		return check;
	},

	_deactivate: function() {
		if(this.$active && this.$active.is("." + this.classes.ITEM)) {
			this.$active.removeClass("ui-state-active");
			this.$active = null;
		}
	},

	_activate: function($token) {
		this._deactivate();

		if($token && $token.is("." + this.classes.ITEM)) {
			this.$active = $token.addClass("ui-state-active");
		}
	},

	_remove: function($token) {
		this.combine.deselect($token.data("item.combine_tokens"), $token);
	},

	_resizeInput: function() {
		var widget = this,
			$input = widget.element;

		widget.$testdiv.text($input.val());
		$input.width(widget.$testdiv.outerWidth(true) + 10);
	},

	_createTestDiv: function() {
		var widget = this;

		widget.$testdiv = $("<div></div>")
			.css({
				position: "absolute",
				left: "-10000px",
				fontSize: widget.element.css("fontSize"),
				marginLeft: widget.element.css("marginLeft"),
				marginRight: widget.element.css("marginRight"),
				paddingLeft: widget.element.css("paddingLeft"),
				paddingRight: widget.element.css("paddingRight")
			})
			.insertAfter(widget.element);
	},

	destroy: function() {
		if(this.options.multiple) {
			this.element
				.unbind(".combine_tokens")
				.width(this.element.data("originalWidth"));
		}

		$.Widget.prototype.destroy.call(this);
	}
});

})(jQuery);