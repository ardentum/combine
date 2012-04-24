(function($) {

$.widget("combine.select", {
	options: {},

	_create: function() {
		var widget = this;

		widget.combine = widget.element.data("combine");

		if(widget.element.is("select")) {
			var $first = widget.element.find("option:first");

			widget.$select = widget.element;

			if($first.val() === "" && !$first.prop("disabled")) {
				widget.combine.options.allowDefault = true;
				$first.prop("disabled", true);
			}

			widget._initSource();
			widget.combine.element = widget.$input = widget._renderInput();

			widget.$select
				.hide()
				.data("name", widget.$select.attr("name") || "")
				.removeAttr("name");

			widget.$select.data("element", widget.$input);

			widget.$input.bind("combine_ready.combine_select", function() {
				widget.$select.find("option:selected").each(function() {
					var $option = $(this),
						text = $option.text(),
						value = $option.val();

					widget.combine.select({
						label: text || value,
						value: value || text
					});
				});
			});

			widget._bindEvents();
		}
	},

	_bindEvents: function() {
		var widget = this;

		widget.$input.bind({
			"combine_select.combine_select": function(event, ui) {
				widget._findByValue(ui.item.value).prop("selected", true);
			},

			"combine_deselect.combine_select": function(event, ui) {
				widget._findByValue(ui.item.value).prop("selected", false);
			}
		});
	},

	_findByValue: function(value) {
		return this.$select.find("option[value='" + value + "']");
	},

	_renderInput: function() {
		var widget = this;

		return $("<input type='text'>")
			.data(widget.$select.data())
			.data("combine", widget.combine)
			.attr("name", widget.$select.attr("name") || "")
			.val(widget.$select.find("option:selected").text() || "")
			.addClass(widget.options.addClass || widget.$select.attr("class"))
			.insertAfter(widget.$select);
	},

	_optionsToArray: function($options, extraParams) {
		return $.map($options.not(":disabled"), function(option) {
			var $option = $(option),
				dataParams = $option.data("combine-params") || {};

			return $.extend({
				value: $option.val() || $option.text(),
				label: $option.text()
			}, extraParams, dataParams);
		});
	},

	_initSource: function() {
		var widget = this,
			source = [],
			$groups = widget.$select.find("optgroup");

		if($groups.length) {
			widget.combine.options.list.groupBy = "group";

			$groups.each(function() {
				var $group = $(this);

				$.merge(source, widget._optionsToArray($group.find("option"), {
					group: $group.attr("label")
				}));
			});

			$.merge(source, widget._optionsToArray(widget.$select.find("> option"), {
				group: ""
			}));
		} else {
			source = widget._optionsToArray(widget.$select.find("option"));
		}

		widget.combine.options.source = source;
	},

	destroy: function() {
		var widget = this;

		if(widget.$select) {
			widget.$select
				.removeData("combine")
				.attr("name", widget.$select.data("name") || "")
				.show()
				.find(".ui-combine-empty-option").remove();

			widget.$input.remove();
			widget.combine.element = widget.$select;
		}

		$.Widget.prototype.destroy.call(widget);
	}
});

})(jQuery);