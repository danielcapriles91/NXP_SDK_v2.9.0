/*
 * Copyright 2020 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */

/**
 * Class allowing to read settings values from component instance
 * Constructor
 *
 * @param node of Java object IChild
 */
ComponentSettings = function(JNode) {
	var self = this;
	
	/** Retrieves setting with id relative to parent
	 *
	 * @param {type} id relative to parent setting
	 * @returns setting object
	 */
	self.getSetting = function (id) {
		var setting = JNode.getChildById(id);
		if (!setting) {
			return null;
		}
		return setting;
	};
	
	/** Retrieves setting with id relative to parent or return null
	 *
	 * @returns parent setting object
	 */
	self.getParent = function () {
		return JNode.getChildContext().getParent();
	};

	/** Retrieves value for setting determined by ID
	 *
	 * @param {type} id in the form of configSetID.settingId.subSettingId
	 * @returns {undefined}
	 */
	self.loadValue = function (id) {
	    var setting = self.getSetting(id);
	    if (setting !== null && setting.getTypeName() == "variable") {
    	    return setting.getValue();
        } else {
            return null;
        }
	};
	
	/** Method allowing to process structure in the component which contains variables that are used as template references.
	 * 
	 * @param  {String} structure name which will be processed
	 * @returns {Object} parameters object
	 */
	self.loadParameters = function (codeStructId){
		var parameters = {};
		var codeStructSetting = self.getSetting(codeStructId);
		codeStructSetting.getChildren().forEach(
			function (item){
				parameters[item.getName()] = item.getValue();		
			}
		);
		return parameters;
	};

	self.loadVariables = function (codeStructId){
		var parameters = [];
		var codeStructSetting = self.getSetting(codeStructId);
		codeStructSetting.getChildren().forEach(
			function (item){
				parameters.push(item.getValue());
			}
		);
		return parameters;
	};




};


/** Class to allow process expressions for specific component instance
*
* @param {componentInstance} object of component instance 
*/
ExpressionProvider = function(componentInstance) {
	var self = this;
	var JExpression = Java.type("com.nxp.swtools.common.utils.expression.Expression");
	
	/** 
	* @param {string} expression string input e.g. "$this.getValue()"
	* @returns {string} expression result
	*/
	self.resolveExpr = function(expr){
		var ex = JExpression.create(expr);
		var result = ex.resolve(componentInstance.getExpressionContext());
		return result;
	};
};


/**
 * Class allowing to process custom files
 */
CustomFileUtils = new function(componentInstance) {
	var self = this;
	
	 /**
	 * Custom section object
	 *
	 * @param {String} id of the section (from the component)
	 * @param {String} name of the section (will be generated in the comment, "" - no comment generated)
	 * {string} merged content of the section with the same id
	 */
	self.customSection = function(id, name) {
		this.id = id;
		this.name = name;
		this.content="";
	};
	
	 /**
	 * Function adding custom section to be generated in the file
	 *
	 * @param {String} id of the section (from the component)
	 * @param {String} name of the section (will be generated in the comment, "" - no comment generated)
	 * @param {Array} array of custom sections which will be generated in the file
	 */
	self.addCustomSection = function(id, name, fileSections){
		fileSections.push(new self.customSection(id, name));
	};

	 /**
	 * Function adds content to the custom section object
	 *
	 * @param {String} id of the section (from the component)
	 * @param {String} content which will be generated
	 */
	self.addSectionContent = function(section, content) {
		section.content += content;
	};
	
	 /**
	 * Function generates content of the sections
	 *
	 * @param {Object} functional group component instances objects
	 * @param {Array} objects of customSections which will be generated
	 * @returns {String} generated content
	 */	
	self.generateCustomSectionsContent = function(componentInstance, sectionIDs){
	var result="";
	var configSets = componentInstance.getChildren();
	for (section in sectionIDs) {
		for (configSet in configSets){
			var codeEmitter = configSets[configSet].getCodeEmitter();
			if (codeFragment = codeEmitter.emit(sectionIDs[section].id)) {
				self.addSectionContent(sectionIDs[section], codeFragment);
			}else{
				return null;
			};
		};
		result += Utils.renderSection(Utils.removeDuplicitLines(sectionIDs[section].content), sectionIDs[section].name);
	};
	return result;
	};

	/**
	 * Function to generate custom file
	 *
	 * @param {String} fileName generated file name
	 * @param {String} folder in which the file will be generated
	 * @param {String} core ID
	 * @param {String} generated content
	 * @param {String} license at the top of the generated file (optional)
	 * @returns {undefined}
	 */
	 
	self.generateCustomFile = function(fileName, folder, coreId, content, license) {
		if(license === undefined){
			license=Utils.makeInitComment([
				"This file was generated by the MCUXpresso Config Tools. Any manual edits made to this file",
				"will be overwritten if the respective MCUXpresso Config Tools is used to update this file."])+"\n\n";			
		};
		new OutputFile(folder + fileName, coreId).close(license + content);
	};
	
	/**
	 * Function to generate custom binary file
	 *
	 * @param {String} fileName generated file name
	 * @param {String} folder in which the file will be generated
	 * @param {String} core ID
	 * @param {String} generated content in bytes
	 * @returns {undefined}
	 */
	 
	self.generateCustomBinFile = function(fileName, folder, coreId, bytes) {
		new OutputBinaryFile(folder + fileName, coreId).close(bytes);
	};

	
	/**
	 * Function to generate content from template.
	 *
	 * @param {String} template file 
	 * @param {Object} parameters descriptor object
	 * @returns {String} generated contetnt
	 */
	self.generateTemplateContent = function(template, parameters) {
		 scriptApi.requireScript("template_engine.js");
		var tEngine = new TemplateEngine();
		var content = tEngine.generate(template, parameters); 
		return content;
	};

	/**
	 * Function to generate file from template.
	 *
	 * @param {String} template file 
	 * @param {String} fileName generated file name
	 * @param {String} folder in which the file will be generated
 	 * @param {String} core ID
	 * @param {Object} parameters descriptor object
	 * @param {String} license at the top of the generated file
	 * @returns {undefined}
	 */
	self.generateTemplateFile = function(template, fileName, folder, coreId, parameters, license) {
		var content = self.generateTemplateContent(template, parameters);
		self.generateCustomFile(fileName, folder, coreId, content, license);
	};
};
