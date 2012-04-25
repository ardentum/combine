(function($) {
$.widget("ui.combine", {
	options: {
		// ����� ��������

		/*
		* �������� ������: ������, ���, ��� �������.
		*
		* ������� ��������� ��������� (term, strict),
		* ��� term - ������,
		* strict - ���� �������� ������, ���������� ��� ��������� ���������� �������� -
		* � ���� ������ ��������� - ������ � ����� ��������� ��������������� �������.
		*
		* ��������� ������� ����� ���� �����������,
		* ����������� � ������ ������ ���� $.Deffered ������,
		* � � ����� ������� � ������ ��������� ������������ ������
		* ������ ���������� ����� resolve(result) ����� �������,
		* ��� result - ������ ��������� ���������
		*
		* ������:
		* function() {
		*     var state = $.Deferred();
		*
		*     someAsyncFuncton(function(result) {
		*         state.resolve(result);
		*     });
		*
		*     return state;
		* }
		*
		* ��. ��� Deferred ������� �� http://api.jquery.com/category/deferred-object/
		*/
		source: [],

		disabled: false,

		// �������� �������� �������������� �������� ��� ������������� �������
		checkOnReady: true,

		// ��������� ���� ���������, ������������� � ������
		validation: false,

		// ���� true - ��� ������ ������������� �������� � ���������� ����� ������� ������������� �����,
		// ���� false - ����� ������� �������� defaultItem
		backup: true,

		// ������ ��� ���������� ��������. ����� ������ � ���� {value, label}
		defaultItem: "",

		allowDefault: false,

		// ��������� ������ � ������ �������.
		// ���� true, ��� ������� ����-����� ����� ������ ������ �� ����� ����������
		emptyRequest: true,

		// ����� ������ ����������������� �������� - ������, ������ ({value,label}), ��� ������ �������� ��� multiple
		selected: "",

		multiple: false,

		// ������ ����������� ��� ������������� �������
		addClass: "",

		// ������ ������������ �������
		modules: "select input search storage list tokens",

		// �������� �������

		input: {
			// �������� �� ����
			delay: 200,

			// ����������� ����� ������ �������
			minLength: 1
		},

		list: {
			// �������� ��������, ���� ����� �������� ������
			appendTo: "body",

			// ����� ���� ��� ������� � ������� pageup-pagedown
			pageSize: 5,

			// ���� false, ������ �������� ������ �� ����� ���������
			button: true,

			// ����������� ��������� ������ ("group")
			// ����� ������� �������� ���� ��� �������, ������������ ���� ��� �����������, ��������:
			// function(itemData) {
			//    return itemData.label.substr(0,1);
			// },
			// ����� ������������ �������� ������ �� ������ �����
			groupBy: null,

			addClass: ""
		},

		search: {
			// �������������� ������������ ���������
			extraParams: {},

			// �������� ����������� ����������� �������
			caching: true
		},

		tokens : {
			// ����������� ��������� ����� �������� �� ������ � ����� ������
			ordered: false,

			// ���� �������� - ����� �������� ��������� ��������� � ���������� value
			allowDuplicates: false,

			// ���� �������� - ��������� �� ����������� ������ ��� ����������� ��������
			filterDuplicates: true,

			// �������� ��� ��������� ������� ������.
			// ���������� ��� �������������� ���������� �������� ��������� �� ������
			// ��� ������� BACKSPACE ��� DELETE � multiple
			keydownDelay: 200,

			containerClass: ""
		}
	},

	_create: function() {
		this.options.checkOnReady = this.options.checkOnReady && !this.options.multiple;
		this._extendOptionsFromData(this.options);
		this._initModules();
		this._bindEvents();
		this._trigger("_ready", new $.Event("ready"));
	},

	_initModules: function() {
		var widget = this;

		//initialize modules
		widget.modules = {};

		$.each(widget.options.modules.split(" "), function(i, moduleName) {
			var module = $.combine[moduleName],
				moduleOptions,
				options;

			if(module) {
				moduleOptions = widget.options[moduleName] || {};
				options = $.extend({}, widget.options, moduleOptions);
				widget._extendOptionsFromData(options, moduleName);
				widget.modules[moduleName] = new module(options, widget.element);
				widget.modules[moduleName].combine = widget;

				if(typeof moduleOptions._extend === "object") {
					$.extend(widget.modules[moduleName], moduleOptions._extend);
				}
			}
		});
	},

	_setOption: function(key, value) {
		var widget = this;

		switch(key) {
			case "disabled":
				widget.disabled = value;
				widget._trigger("_disabled", new $.Event("_disabled"), {
					switcher: value
				});
				break;
		}
	},

	_bindEvents: function() {
		var widget = this;

		widget.element.bind({
			"combine_ready.combine": function() {
				if(widget.options.multiple && $.isArray(widget.options.selected)) {
					$.each(widget.options.selected, function(i, item) {
						widget.select(widget._normalize(item));
					});
				} else if(widget.options.selected) {
					widget.select(widget._normalize(widget.options.selected));
				} else {
					widget.select();
				}

				widget._setOption("disabled", widget.options.disabled);
			},

			"combine_select.combine": function(event, ui) {
				if(widget.options.multiple) {
					widget.selected = widget.selected || [];
					widget.selected.push(ui.item);
				} else {
					widget.selected = ui.item;
				}
			},

			"combine_deselect.combine": function(event, ui) {
				if(widget.options.multiple) {
					var index;

					$.each(widget.selected, function(i, item) {
						if(item.value === ui.item.value) {
							index = i;
							return false;
						}
					});

					widget.selected.splice(index, 1);
				} else {
					widget.selected = null;
				}
			}
		});
	},

	_extendOptionsFromData: function(options, prefix) {
		var widget = this;

		prefix = prefix ? (prefix + "-") : "";

		$.each(options, function(name) {
			var data = widget.element.data("combine-" + prefix + name.toLowerCase()),
				dataInt = parseInt(data);

			if(data === "false") {
				data = false;
			}

			if(data === "true") {
				data = true;
			}

			if(!isNaN(dataInt)) {
				data = dataInt;
			}

			if(typeof data !== "undefined") {
				options[name] = data;
			}
		});
	},

	_normalize: function(item) {
		if(typeof item === "string" || typeof item === "number") {
			return {
				label: item,
				value: item
			};
		}

		return $.extend({
			label: item.label || item.value,
			value: item.value || item.label
		}, item);
	},

	search: function(term, extraParams) {
		var widget = this;

		if(!widget.disabled && false !== widget._trigger("_before_search", {term : term, extraParams: extraParams})) {
			widget._trigger("_search", new $.Event("search"), {
				term: term,
				extraParams: extraParams
			});
		}
	},

	response: function(result, term) {
		var widget = this;

		if(false !== widget._trigger("_before_response", new $.Event("response"), {result: result, term: term})) {
			widget._trigger("_response", new $.Event("response"), {
				result: result,
				term: term
			});
		}
	},

	select: function(item, added, event) {
		var widget = this;

		event = event || new $.Event("_select");

		if(widget.options.multiple && (!item || item.value === "")) {
			return false;
		}

		if(typeof added === "undefined") {
			added = false;
		}

		if(!widget.options.multiple && (typeof item === "undefined" || item.value === "")) {
			item = widget._normalize(widget.options.defaultItem);
			item._default = true;
		}

		if(typeof item._combineAdded === "undefined") {
			item._combineAdded = added;
		} else {
			added = item._combineAdded;
		}

		if(item) {
			if(!widget.options.multiple && widget.selected) {
				widget.deselect(widget.selected);
			}

			if(false !== widget._trigger("_before_select", event, {item : item, added: added})) {
				widget._trigger("_select", event, {
					item: item,
					added: added
				});
			} else {
				widget.element.val("");
			}
		}
	},

	deselect: function(item, $token) {
		var widget = this;

		if(false !== widget._trigger("_before_deselect", new $.Event("deselect"), {item : item})) {
			widget._trigger("_deselect", new $.Event("deselect"), {item : item, $token : $token});
		}
	},

	check: function(value) {
		var widget = this,
			state = $.Deferred(),
			check = this._trigger("_before_check", {value : value});

		if(check !== false) {
			$.when(check)
				.done(function() {
					widget._trigger("_check", new $.Event("check"), {
						value : value,
						state: state
					});
				})
				.fail(function() {
					state.reject();
				});
		} else {
			state.reject();
		}

		return state;
	},

	setOptions: function(options) {
		$.extend(this.options, options || {});
	},

	destroy: function() {
		var widget = this;

		$.each(widget.modules, function(name, module) {
			module.destroy();
		});

		widget.element.unbind(".combine");
		$.Widget.prototype.destroy.call(widget);
	}
});
})(jQuery);