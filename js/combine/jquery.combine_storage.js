(function($) {

$.widget("combine.storage", {
	options: {},

	_create: function() {
		var widget = this;

		widget._initStorage();
		widget._bindEvents();
	},

	_initStorage: function() {
		var widget = this;

		widget.$storage = $("<select></select>").hide()
			.prop("multiple", true)
			.attr("name", widget.element.attr("name") || "")
			.insertBefore(widget.element);

		widget.element
			.data("name", widget.element.attr("name") || "")
			.removeAttr("name");
	},

	_bindEvents: function() {
		var widget = this;

		widget.element.bind({
			"combine_select.combine_storage" : function(event, ui) {
				widget._select(ui.item);
			},

			"combine_deselect.combine_storage": function(event, ui) {
				widget._deselect(ui.item);
			}
		});
	},

	_findByValue: function(value) {
		return this.$storage.find("option[value='" + value + "']");
	},

	_select: function(item) {
		var widget = this;

		if(!widget._findByValue(item.value).length) {
			$("<option></option>")
				.val(item.value)
				.text(item.label)
				.appendTo(widget.$storage)
				.prop("selected", true);
		}
	},

	_deselect: function(item) {
		this._findByValue(item.value).remove();
	},

	destroy: function() {
		var widget = this;

		widget.element
			.unbind(".combine_storage")
			.attr("name", widget.element.data("name"));

		widget.$storage.remove();

		$.Widget.prototype.destroy.call(widget);
	}
});

})(jQuery);