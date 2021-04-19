/*
 * Copyright 2020 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */
  scriptApi.requireScript("codegenerator_utilities.js");
  scriptApi.requireScript("template_engine.js");
/**
 * Function to generate FreeMASTER application code.
 *
 * @param {ComponentInstance} componentInstance
 * @param {FunctionalGroup} functionalGroup
 * @returns {undefined}
 */
function FREEMASTERgenerator(componentInstance, functionalGroup) {
	var coreId = functionalGroup.getCore();
	var modeId = componentInstance.getMode().getId();
	/* Adding license to the begin of the generated code */
	var codeTemplate = componentInstance.readComponentFile("freemaster_cfg_h.template");
	var folderPath = "/source/";
	/** Generate file for the selected mode */
	switch (modeId) {
		case "general":	
			/** Load values from component UI and apply them on the template (all template references must be defined) */
			var configSetSettings = new ComponentSettings(componentInstance.getChildById("freemaster_config"));		//configSet id
			var parameters = configSetSettings.loadParameters("freemaster_codegenerator");
			/** Generate content from template */
			CustomFileUtils.generateTemplateFile(codeTemplate,"freemaster_cfg.h", folderPath, coreId, parameters);
			break;
		default:
			scriptApi.logError("Unknown mode " + ModeId);
		return;
	}
};

// register code generation function
CodeGenerator.registerInstanceCodeGenerator(FREEMASTERgenerator);
