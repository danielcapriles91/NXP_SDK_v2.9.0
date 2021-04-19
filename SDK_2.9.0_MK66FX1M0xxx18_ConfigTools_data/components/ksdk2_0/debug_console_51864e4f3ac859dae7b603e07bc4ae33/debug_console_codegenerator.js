/*
 * Copyright 2020 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */
  scriptApi.requireScript("codegenerator_utilities.js");
  scriptApi.requireScript("template_engine.js");
/**
 * Function to generate Debug Console application code.
 *
 * @param {ComponentInstance} componentInstance
 * @param {FunctionalGroup} functionalGroup
 * @returns {undefined}
 */
function DebugConsoleGenerator(componentInstance, functionalGroup) {
	var coreId = functionalGroup.getCore();
	var modeId = componentInstance.getMode().getId();
	/* Adding license to the begin of the generated code */
	var codeTemplate = componentInstance.readComponentFile("fsl_debug_console_conf_h.template");
	var folderPath = "/utilities/";
	
	/** Generate file for the selected mode */
	switch (modeId) {
		case "general":	
			/** Load values from component UI and apply them on the template (all template references must be defined) */
			var configSetSettings = new ComponentSettings(componentInstance.getChildById("fsl_debug_console"));		//configSet id
			var parameters = configSetSettings.loadParameters("debug_console_codegenerator");
			/** Generate content from template */
            if (!componentInstance.getError()) {
                CustomFileUtils.generateTemplateFile(codeTemplate,"fsl_debug_console_conf.h", folderPath, coreId, parameters);
            }
			break;
		default:
			scriptApi.logError("Unknown mode " + ModeId);
		return;
	}
};

// register code generation function
CodeGenerator.registerInstanceCodeGenerator(DebugConsoleGenerator);
