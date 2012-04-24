(function($) {
$.widget("combine.list", {
	options: {},

	classes: {
		LOADING: "ui-state-loading",
		HOVER: "ui-state-hover",
		LIST: "ui-combine-list",
		GROUP: "ui-combine-list-group",
		GROUP_TITLE: "ui-combine-list-group-title",
		ITEM: "ui-combine-list-item",
		BUTTON: "ui-combine-list-button",
		DEFAULT: "ui-combine-item-list-default"
	},

	_create: function() {
		var widget = this;

		widget.$list = widget._renderList();
		widget.$active = null;
		widget._bindEvents();

		if(widget.options.button) {
			widget._initButton();
		}
	},

	_bindEvents: function() {
		var widget = this;

		widget.element.bind({
			"keydown.combine_list": function(event) {
				widget.mouseMoved = false;
				widget.preventCancel = true;

				switch(event.keyCode) {
					case $.ui.keyCode.PAGE_UP:
						event.preventDefault();
						widget.move(event, "prev", widget.options.pageSize);
						break;
					case $.ui.keyCode.PAGE_DOWN:
						event.preventDefault();
						widget.move(event, "next", widget.options.pageSize);
						break;
					case $.ui.keyCode.DOWN:
						event.preventDefault();
						widget.move(event, "next");
						break;
					case $.ui.keyCode.UP:
						event.preventDefault();
						widget.move(event, "prev");
						break;
					case $.ui.ESCAPE:
						widget.element.data("preventKeyPress" ,true);
						break;
					case $.ui.TAB:
						widget.preventCancel = true;
						break;
					case $.ui.keyCode.BACKSPACE:
						setTimeout(function() {
							if(widget.element.val() === "") {
								widget.close(event);
							}
						}, 0);
						break;
					case $.ui.keyCode.ESCAPE:
						widget.element.data("preventKeyPress", true);
						widget.cancel();
						widget.close(event);
						break;
					case $.ui.keyCode.ENTER:
						if(widget.opened) {
							if(widget.$active) {
								widget._select(widget.$active, event);
								event.preventDefault();
							} else {
								widget.close(event);
							}
						}
						break;
				}
			},

			"combine_search.combine_list": function() {
				if(widget.options.button) {
					widget.$button.addClass(widget.classes.LOADING);
				}
			},

			"combine_before_response": function() {
				if(widget.options.button) {
					setTimeout(function() {
						widget.$button.removeClass(widget.classes.LOADING);
					}, 0);
				}
			},

			"combine_response.combine_list": function(event, ui) {
				if(ui.result.length) {
					widget.open(ui.result, ui.term);

					if(widget.options.validation && ui.term !== "") {
						widget._activate(event, widget.$list.find("." + widget.classes.ITEM).first());
					}
				} else {
					widget.close(event);
				}
			},

			"combine_blur.combine_list": function(event) {
				if(!widget.preventCancel) {
					widget.cancel(event);
				}

				widget.close(event);

				if(widget.options.button) {
					widget.$button.removeClass(widget.classes.LOADING);
				}
			}
		});

		widget.$list
			.bind({
				"mousedown.combine_list": function() {
					setTimeout(function() {
						clearTimeout(widget.combine.bluring);
						widget.element.focus();
						widget.element.val(widget.element.val());
					}, 0);
				},

				"mousemove.combine_list": function() {
					widget.mouseMoved = true;
				}
			})
			.delegate("." + widget.classes.ITEM, "click.combine_list", function(event) {
				widget._select($(this), event);
			})
			.delegate("." + widget.classes.ITEM, "mouseover.combine_list", function(event) {
				var $element = $(this);

				// check mouse moving on list element
				// to prevent mouseover when the list scrolled by keyboard
				if(widget.mouseMoved) {
					widget._activate(event, $element);
					widget.cancel();
				}
			});
	},

	_initButton: function() {
		var widget = this;

		widget.$button = $("<div></div>")
			.addClass(widget.classes.BUTTON)
			.insertAfter(widget.element)
			.bind({
				"mousedown.combine_list": function(event) {
					event.preventDefault();

					setTimeout(function() {
						clearTimeout(widget.combine.bluring);
						widget.element.focus();
						widget.element.val(widget.element.val());
					}, 0);
				},
				"mouseup.combine_list": function(event) {
					if(widget.opened) {
						widget.close(event);
					} else {
						widget.combine.search("", {isForced: 1});
					}
				},

				"click.combine_list": function() {
					event.stopPropagation();
				}
			});

		widget.element.parent().css({
			paddingRight: widget.$button.width() + "px"
		});

		if(widget.options.validation) {
			widget.$button.addClass("ui-list-icon");
		}
	},

	_makeGroups: function(result) {
		var widget = this,
			groups = {},
			groupBy = widget.options.groupBy;

		$.each(result, function(key, itemData) {
			if(itemData) {
				var groupName = ((typeof groupBy === "function") ? groupBy(itemData) : itemData[groupBy]) || "";

				groups[groupName] = groups[groupName] || [];
				groups[groupName].push(itemData);
			}
		});

		return groups;
	},

	_renderList: function() {
		var widget = this;

		return $("<ul></ul>")
			.addClass(widget.classes.LIST)
			.addClass(widget.options.addClass)
			.hide()
			.appendTo(widget.options.appendTo);
	},

	_renderGroup: function(groupName, group) {
		var widget = this,
			$group = $("<div></div>").addClass(widget.classes.GROUP);

		if(groupName !== "") {
			$("<div></div>")
				.addClass(widget.classes.GROUP_TITLE)
				.text(groupName)
				.prependTo($group);
		}

		$.each(group, function(key, itemData) {
			if(itemData) {
				widget._renderItem(itemData).appendTo($group);
			}
		});

		return $group;
	},

	_renderItems: function(result) {
		var widget = this;

		if(widget.options.groupBy) {
			$.each(widget._makeGroups(result), function(groupName, group) {
				widget._renderGroup(groupName, group).appendTo(widget.$list);
			});
		} else {
			$.each(result, function(key, itemData) {
				if(itemData) {
					widget._renderItem(itemData).appendTo(widget.$list);
				}
			});
		}
	},

	_renderItem: function(item) {
		return $("<li></li>")
			.data("combine.item", item)
			.addClass(this.classes.ITEM)
			.addClass(item._default ? this.classes.DEFAULT : "")
			.html(item.label);
	},

	_select: function($item, event) {
		var widget = this;

		if($item) {
			var itemData = $item.data("combine.item");

			clearTimeout(widget.combine.bluring);
			widget.element.data("preventKeyPress", !widget.options.multiple && event.type.match(/keyup|keydown|keypress/g));
			widget.cancel();
			widget.combine.select(itemData, false, event);
			widget.close(event);
		}
	},

	_deactivate: function() {
		if(this.$active) {
			this.$active.removeClass(this.classes.HOVER);
			this.$active = null;
		}
	},

	_activate: function(event, $item) {
		var widget = this;

		if(!$item.is(".ui-state-hover")) {
			// deactivate last active item
			widget._deactivate();

			if($item && $item.length) {
				var offset = $item.offset().top - widget.$list.offset().top,
					listHeight = widget.$list.height(),
					itemHeight = $item.outerHeight(true),
					scroll = widget.$list.scrollTop();

				widget.$active = $item.addClass(widget.classes.HOVER);

				offset -= (parseInt(widget.$list.css("border-top-width")) * 2);
				if(offset + itemHeight/2 >= listHeight) {
					widget.$list.scrollTop(scroll + offset - listHeight + itemHeight);
				} else if (offset < 0) {
					widget.$list.scrollTop(scroll + offset);
				}

				widget.combine._trigger("_activate", event, {
					element: $item,
					item: $item.data("combine.item")
				});
			} else {
				widget.cancel();
			}
		}
	},

	_position: function() {
		var widget = this,
			$element = widget.combine.$container,
			heightMenu = widget.$list.outerHeight(),
			spaceAbove = $element.offset().top -  $("body").scrollTop(),
			spaceBelow = $(window).height() - spaceAbove - $element.outerHeight(),
			position;

		if(heightMenu < spaceBelow || heightMenu > spaceAbove) {
			position = {my: "left top", at: "left bottom"};
		} else {
			position = {my: "left bottom", at: "left top"};
		}

		// Вызываем position два раза для лечения бага jquery.ui
		widget.$list
			.outerWidth($element.innerWidth() - 1)
			.position($.extend({of: $element, collision: "none none"}, position))
			.position($.extend({of: $element, collision: "none none"}, position));
	},

	open: function(result, term) {
		var widget = this;

		widget.opened = true;
		widget.term = widget.element.val();
		widget.$list.empty().detach();
		widget._renderItems(result, term);
		widget.$list.appendTo(widget.options.appendTo).show();
		widget.$items = widget.$list.find("." + widget.classes.ITEM);
		widget._position();
	},

	cancel: function() {
		if(this.opened && this.element.val() !== this.term) {
			this.element.val(this.term);
		}
	},

	close: function(event) {
		var widget = this;

		widget.opened = false;
		widget.$list.hide();
		widget.$active = null;
		widget.combine._trigger("_close", event);
	},

	move: function(event, direction, steps) {
		var widget = this,

		_move = function(direction, steps) {
			var sign = (direction === "next") ? 1 : -1,
				index = widget.$items.index(widget.$active || -1) + (sign * steps);

			if(index === -1 || index >= widget.$items.length) {
				widget._deactivate();
				widget.cancel();
				return;
			}

			if(index < 0) {
				index = widget.$items.length - 1;
			}

			if(index === 0) {
				widget.$list.scrollTop(0);
			}

			widget._activate(event, widget.$items.eq(index));
			widget.element.val(widget.$active.data("combine.item").label);
		};

		widget.element.data("preventKeyPress" ,true);

		if(!widget.opened) {
			if(!widget.options.emptyRequest) {
				return;
			}

			widget.element.one("combine_response", function() {
				if(widget.opened) {
					_move(direction, steps || 1);
				}
			});

			widget.combine.search("", {isForced: 1});
		} else {
			_move(direction, steps || 1);
		}
	},

	destroy: function() {
		var widget = this;

		widget.element.unbind(".combine_list");

		if(widget.options.button) {
			widget.$button.remove();
			widget.element.width(widget.width + "px");
			widget.element.css("paddingRight", widget.paddingRight + "px");
		}

		widget.$list.remove();
		$.Widget.prototype.destroy.call(widget);
	}
});
})(jQuery);