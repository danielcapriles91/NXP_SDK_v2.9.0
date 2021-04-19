/*
 * Copyright 2020 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */
  scriptApi.requireScript("codegenerator_utilities.js");
  scriptApi.requireScript("template_engine.js");
/**
 * Function to generate DSC bootloder startup config application code.
 *
 * @param {ComponentInstance} componentInstance
 * @param {FunctionalGroup} functionalGroup
 * @returns {undefined}
 */
function startupGenerator(componentInstance, functionalGroup) {
	var coreId = functionalGroup.getCore();
	var modeId = componentInstance.getMode().getId();
	/* Adding license to the begin of the generated code */
	var codeTemplate = componentInstance.readComponentFile("startup_bootloader_config_h.template");
	var folderPath = "/startup/";
	
	/** Generate file for the selected mode */
	switch (modeId) {
		case "general":	
			/** Load values from component UI and apply them on the template (all template references must be defined) */
			var configSetSettings = new ComponentSettings(componentInstance.getChildById("startup_config"));		//configSet id
			var parameters = configSetSettings.loadParameters("startup_codegenerator");
			/** Generate content from template */
			CustomFileUtils.generateTemplateFile(codeTemplate,"startup_bootloader_config.h", folderPath, coreId, parameters);
			break;
		default:
			scriptApi.logError("Unknown mode " + ModeId);
		return;
	}
};

// register code generation function
CodeGenerator.registerInstanceCodeGenerator(startupGenerator);
