/*
 * Copyright 2018-2019 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */
/*
 * Templating engine
 * Usage: Use '$' to separate simple text from options. Use <code></code> to separate options from a code.
 *
 * Usage example:
 * var template = 'This text will be printed as is.\\n${ text }$\\nCode example:${<code>\
 * for(var i=0; i<5; i++){\
 * 	</code>}$\\nIteration #${ i <code>\
 * }\
 * </code>}$';
 *	var options = {text : 'This text will be inserted as an option.'};
 *	var finalText = templateEngine(template, options);
 */
TemplatingEngine = function() {
	var self = this;
	self.generate = function(template, options){
		var outputCode = 'var r=[];';

		// split code into simple text and option with code sections
		// \s\S to match all chars including white space
		var splitTemplate = template.split(/(\$\{[\s\S]*?\}\$)/);
		// create a code based on the template
		splitTemplate.forEach(function(part){
			if(part.charAt(0) === '$'){
				// remove '$' and split part into options and code sections
				var splitPart = part.slice(2, -2).split(/(<code>[\s\S]*?<\/code>)/);
				splitPart.forEach(function(option){
					if(option.startsWith("<code>")){
						// remove <code> and </code>
						option = option.slice(6, -7);
						outputCode += option;
					}else{
						outputCode += 'r.push(' + option + ');';
					}
				});
			}else{
				// preserve line breaks when the template is read from a file
				part = part.replace(/(\r\n|\r|\n)/g, "\\n\\$1");
				outputCode += 'r.push(\'' + part + '\');';
			}
		});
		outputCode += 'return r.join("");';
		// execute assambled code and return the result
		return new Function(' with (this) { ' + outputCode + '}').apply(options);
	};
};
