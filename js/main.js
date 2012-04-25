var optionsData = {
		source: {
			type: "json",
			description: "Источник данных",
			value: [
				"ActionScript",
				"AppleScript",
				"Asp",
				"BASIC",
				"C",
				"C++",
				"Clojure",
				"COBOL",
				"ColdFusion",
				"Erlang",
				"Fortran",
				"Groovy",
				"Haskell",
				"Java",
				"JavaScript",
				"Lisp",
				"Perl",
				"PHP",
				"Python",
				"Ruby",
				"Scala",
				"Scheme"
			]
		},
		disabled: {
			value: false
		},

		checkOnReady: {
			description: "Включает валидацию установленного значения при инициализации виджета",
			value: true
		},

		validation: {
			description: "Запрещает ввод элементов, отсутствующих в списке",
			value: false
		},

		backup: {
			description: "Если true - при выборе недопустимого значения в комбобоксе будет выбрано установленное ранее, если false - будет выбрано значение defaultItem",
			value: true
		},

		defaultItem: {
			type: "json",
			description: "Значение по умолчанию. Можно задать в виде {value, label}",
			value: "123"
		},

		allowDefault: {
			description: "Включает возможность выбора дефолтного значения",
			value: false
		},

		emptyRequest: {
			description: "Разрешает запрос с пустой строкой. Если true, при нажатии вниз-вверх или клике на поле ввода будет открыт список со всеми элементами",
			value: true	
		},

		selected: {
			type: "json",
			description: "Можно задать предустановленные значения - строку, объект ({value,label}), или массив объектов для multiple",
			value: ""
		},

		multiple: {
			description: "Мультиселект",
			value: false
		},

		addClass: {
			description: "Список добавляемых полю ввода классов при инициализации",
			value: ""
		},

		input: {
			type: "moduleOptions",
			description: "Модуль поля ввода",

			options: {
					delay: {
					description: "Задержка на ввод",
					value: 200
				},

				minLength: {
					description: "Минимальная длина строки запроса",
					value: 1
				}
			}
		},

		list: {
			type: "moduleOptions",
			description: "Модуль выпадающего списка",

			options: {
				appendTo: {
					description: "Селектор элемента, куда будет вставлен список",
					value: "body"
				},

				pageSize: {
					description: "Длина шага при скролле с помощью pageup-pagedown",
					value: 5
				},

				button: {
					description: "Если false, кнопка открытия списка не будет добавлена",
					value: true
				},

				groupBy: {
					description: "Группировка элементов списка",
					type: "function",
					value: "",
					examples: [
						{
							text: "Группировка по первой букве",
							value: function(item) {
								return item.value.substring(0,1);
							}
						}
					]
				},

				addClass: {
					description: "Список добавляемых списку классов при инициализации",
					value: "",
				}
			}
		},

		search: {
			type: "moduleOptions",
			description: "Свойства модуля поиска",
			options: {
				extraParams: {
					description: "Дополнительные передаваемые параметры",
					type: "json",
					value: {}
				},

				caching: {
					description: "Включает кэширование результатов запроса",
					value: true
				}
			}
		},

		tokens : {
			type: "moduleOptions",
			description: "Свойства модуля мультиселекта. Зависит от свойства multiple.",

			options: {
				ordered: {
					description: "Включает возможность добавлять новые значения не только в конец списка",
					value: false
				},

				allowDuplicates: {
					description: "Если включено - можно добавить несколько элементов с одинаковым value",
					value: false
				},

				// 
				filterDuplicates: {
					description: "Если включено - исключает из результатов поиска уже добавленные элементы",
					value: false
				},

				keydownDelay: {
					description: "Задержка при обработке нажатия клавиш. Необходима для предотвращения случайного удаления элементов из списка при нажатии BACKSPACE или DELETE в multiple.",
					value: 200
				},

				containerClass: {
					description: "Список добавляемых контейнеру классов при инициализации",
					value: "",
					examples: [
						{
							text: "Список тегов",
							value: "ui-inline"
						}
					]
				}
			}
		}
	};

// Option 
var Option = function(optionName, optionData) {
	this.data = optionData;
	this.name = optionName;
};

Option.prototype = {
	renderInput: function() {
		return $("<input/>")
			.attr("type", "text")
			.attr("name", this.name)
			.val(this.data.value);
	},

	selectExample: function() {
		var $link = $(this);

		$link.closest("label").find(":input")
			.val($link.data("value"))
			.change();

		return false;
	},

	renderExamples: function() {
		var $examples,
			self = this;

		if(this.data.examples) {
			$examples = $("<div>").addClass("examples");

			$("<h4/>")
				.text("Примеры:")
				.appendTo($examples);

			$.each(this.data.examples, function(i, example) {
				$("<a/>")
					.attr("href", "#")
					.text(example.text)
					.data("value", example.value.toString())
					.appendTo($examples)
					.click(self.selectExample);
			});
		}

		return $examples;
	},

	render: function(path) {
		var $label,
			$description,
			$input,
			$examples;

		$label = $("<label/>")
			.text(this.name + ":")

		$input = this.renderInput();
		$input.appendTo($label);

		if(path) {
			var $trueInput = $input.not(":checkbox");
			$trueInput.attr("name", path + "." + $trueInput.attr("name"))
		}

		$description = $("<p/>")
			.addClass("description")
			.text(this.data.description)
			.appendTo($label);

		$examples = this.renderExamples();

		if($examples) {
			$examples.appendTo($label);
		}

		return $label;
	}
};

// BooleanOption
var BooleanOption = function(optionName, optionData) {
	Option.apply(this, arguments);
};

BooleanOption.prototype = $.extend(new Option(), {
	renderInput: function() {
		var $hidden = $("<input/>")
				.addClass("boolean")
				.attr("type", "hidden")
				.attr("name", this.name)
				.val(this.data.value - 0);

		return $("<input/>")
			.attr("type", "checkbox")
			.prop("checked", this.data.value)
			.change(function() {
				$hidden.val($(this).prop("checked") - 0);
			})
			.add($hidden);
	}
});

//JsonOption
var JsonOption = function(optionName, optionData) {
	Option.apply(this, arguments);
};

JsonOption.prototype = $.extend(new Option(), {
	renderInput: function() {
		return $("<textarea/>")
			.addClass("mix")
			.attr("name", this.name)
			.text(JSON.stringify(this.data.value));
	}
});

// FunctionOption
var FunctionOption = function(optionName, optionData) {
	Option.apply(this, arguments);
};

FunctionOption.prototype = $.extend(new Option(), {
	renderInput: function() {
		return $("<textarea/>")
			.addClass("mix")
			.attr("name", this.name)
			.text(this.data.value);
	}
});

// ModuleOptions
var ModuleOptions = function(optionName, optionData) {
	this.data = optionData;
	this.name = optionName;
};

ModuleOptions.prototype.render = function() {
	var $moduleOptions = $("<div/>"),
		$header = $("<div/>");

	$moduleOptions
		.addClass("module-options");

	$header
		.addClass("header")
		.appendTo($moduleOptions);

	$("<h3/>")
		.text(this.name)
		.appendTo($header);

	$("<p/>")
		.addClass("description")
		.text(this.data.description)
		.appendTo($header);

	$("<div/>")
		.addClass("body")
		.appendTo($moduleOptions);

	$header.click(function() {
		$moduleOptions.toggleClass("expanded");
	});

	renderOptions(this.data.options, this.name)
		.appendTo($moduleOptions.find(".body"));

	return $moduleOptions;
};

var renderOptions = function(options, path) {
	var $container = $("<div>");

	$.each(options, function(optionName, option) {
		var $element;

		switch(option.type || typeof option.value) {
			case "boolean":
				$element = (new BooleanOption(optionName, option)).render(path);
				break;
			case "string":
				$element = (new Option(optionName, option)).render(path);
				break;
			case "number":
				$element = (new Option(optionName, option)).render(path);
				break;
			case "json":
				$element = (new JsonOption(optionName, option)).render(path);
				break;
			case "function":
				$element = (new FunctionOption(optionName, option)).render(path);
				break;
			case "moduleOptions":
				$element = (new ModuleOptions(optionName, option)).render();
				break;
		}

		if($element) {
			$element.appendTo($container);
		}
	});

	return $container.children();
};

var serializeJSON = function(array) {
	var json = {};

	$.each(array, function(i, field) {
		if(field.name.match(/^.+\..+$/g)) {
			var splitted = field.name.split(".");

			json[splitted[0]] = json[splitted[0]] || {};
			json[splitted[0]][splitted[1]] = field.value;
		} else {
			json[field.name] = field.value;
		}
	});

	return json;
};

$(function() {
	var $sidebarInputs;

	renderOptions(optionsData).appendTo("#sidebar");
	$sidebarInputs = $("#sidebar").find("input, textarea")

	$sidebarInputs.change(function() {
		var data = $.map($sidebarInputs, function(input) {
			var $input = $(input),
				serialized = $input.serializeArray()[0];

			if($input.is(".number")) {
				serialized.value = parseInt(serialized.value);
			}

			if($input.is(".boolean")) {
				serialized.value = !!parseInt(serialized.value);
			}

			if($input.is(".mix") && serialized.value) {
				try {
					eval("serialized.value = " + serialized.value + ";");
				} catch(e) {

				}
			}

			return serialized;
		});


		$(".combine")
			.val("")
			.combine("destroy")
			.combine(serializeJSON(data));
	});

	$sidebarInputs.first().change();
});