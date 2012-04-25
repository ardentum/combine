(function($) {

$.widget("combine.input", {
	options: {
		delay: 200,
		minLength: 1
	},

	classes: {
		CONTAINER: "ui-combine-container",
		INPUT:     "ui-combine-input",
		DEFAULT:   "ui-combine-default-selected"
	},

	_create: function() {
		var widget = this,
			addClass = (widget.options.addClass !== null) ? widget.options.addClass : widget.element.attr("class");

		widget.$container = $("<div></div>")
			.addClass(widget.classes.CONTAINER)
			.addClass(addClass)
			.width(widget.element.width())
			.insertBefore(widget.element)
			.append(widget.element);

		widget.combine = widget.element.data("combine");
		widget.combine.$container = widget.$container;

		widget.element
			.addClass(widget.classes.INPUT)
			.attr("autocomplete", "off");

		widget._bindEvents();
	},

	_bindEvents: function() {
		var widget = this,
			$input = widget.element,
			suppressKeyPress = false;

		$input.bind({
			"keydown.combine_input" : function(event) {
				if(event.keyCode === $.ui.keyCode.ENTER) {
					event.preventDefault();

					setTimeout(function() {
						var val = $input.val();

						$.when(widget.combine.check($input.val()))
							.done(function(item) {
								widget.combine.select(item);
							})
							.fail(function() {
								if(!widget.options.validation) {
									widget.combine.select(widget.combine._normalize(val), true);
								} else {
									widget.combine.select(widget.options.backup ? widget.checkedItem : undefined);
								}
							});
					}, widget.options.delay);

					return;
				}

				clearTimeout(widget.typing);
				widget.typing = setTimeout(function() {
					var val;

					if(suppressKeyPress) {
						return;
					}

					val = $input.val();
					suppressKeyPress = true;

					if($input.data("preventKeyPress")) {
						$input.removeData("preventKeyPress");
						widget.term = val;
						return;
					}

					if(widget.term !== val) {
						widget.element.trigger("combine_type", event);
					}

					widget.term = val;
				}, widget.options.delay);
			},

			"keyup.combine_input" : function() {
				suppressKeyPress = false;
			},

			"combine_type.combine_input": function() {
				var val = widget.element.val();

				widget.$container.removeClass(widget.classes.DEFAULT);

				if(val.length >= widget.options.minLength) {
					widget.selected = null;
					widget.combine.search(val);
				}
			},

			"blur.combine_input": function(event) {
				// Задержка в 50мс для того, чтобы в обработчике события,
				// приводящего к потере фокуса инпута,
				// мы могли сделать clearTimeout(widget.combine.bluring)
				// и вернуть фокус обратно.
				widget.combine.bluring = setTimeout(function() {
					clearTimeout(widget.typing);
					widget.combine._trigger("_blur", event);
				}, 50);
			},

			"combine_blur.combine_input": function() {
				if(!widget.options.multiple) {
					widget.check();
				}

				suppressKeyPress = false;
				$input.removeData("preventKeyPress");
				widget.term = widget.element.val();
			},

			"combine_select.combine_input": function(event, ui) {
				widget.select(ui.item);
			},

			"combine_ready.combine_input": function() {
				if(widget.options.checkOnReady && $input.val() !== "" && !(widget.combine.options.selected || widget.combine.selected)) {
					widget.check();
				} else {
					widget.term = widget.options.selected ? widget.options.selected.label : $input.val();
				}
			},

			"combine_disabled.combine_input": function(event, ui) {
				$input.prop("disabled", ui.switcher);
			}
		});

		widget.$container.bind({
			"click.combine_input": function() {
				if(widget.options.emptyRequest) {
					$input[0].select();
					widget.combine.search("");
				}
			}
		});
	},

	// Checks input value.
	// Selects an item if value is valid.
	// Selects defaultItem or last checked item if value is invalid and validation is turned on
	// Else selects new added item if validation is off
	// If forced is true - doesn't trigger combine.select event
	check: function() {
		var widget = this,
			val = widget.element.val(),
			state;

		if(widget.selected && widget.selected.label === val) {
			return;
		}

		state = widget.combine.check(val);

		$.when(widget.combine.check(val))
			.done(function(item) {
				widget.combine.select(item);
			})
			.fail(function() {
				if(!widget.options.validation) {
					widget.combine.select(widget.combine._normalize(val), true);
				} else {
					widget.combine.select(widget.options.backup ? widget.checkedItem : undefined);
				}
			});

		return state;
	},

	select: function(itemData) {
		this.term = itemData.label;
		this.element.val(itemData.label);
		this.checkedItem = this.selected = itemData;
		this.$container.toggleClass(this.classes.DEFAULT, !!itemData._default);
	},

	destroy: function() {
		this.element
			.unbind(".combine_input")
			.removeAttr("autocomplete")
			.removeClass(this.classes.INPUT);

		this.$container
			.after(this.element)
			.remove();

		$.Widget.prototype.destroy.call(this);
	}
});

})(jQuery);