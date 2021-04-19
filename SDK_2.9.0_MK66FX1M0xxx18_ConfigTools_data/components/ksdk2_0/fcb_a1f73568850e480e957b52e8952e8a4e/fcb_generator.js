/*
 * Copyright 2020 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */
  scriptApi.requireScript("codegenerator_utilities.js");
  //scriptApi.requireScript("template_engine.js");
/**
 * Function to generate FCB application code.
 *
 * @param {ComponentInstance} componentInstance
 * @param {FunctionalGroup} functionalGroup
 * @returns {undefined}
 */
function FCBgenerator(componentInstance, functionalGroup) {
	var coreId = functionalGroup.getCore();
	var modeId = componentInstance.getMode().getId();
	var folderPath = "/source/";
	
	/** Generate file for the selected mode */
	switch (modeId) {
		case "general":	
			/** Load values from component UI and apply them on the template (all template references must be defined) */
			var configSetSettings = new ComponentSettings(componentInstance.getChildById("fcb_general"));		//configSet id
			
			var parameters = configSetSettings.loadVariables("fcb_config_bin");

    		if (componentInstance.getError()) {
    			scriptApi.logError("FCB initialization causes errors, fcb.bin can not be written.");
    		} else {
			/** Generate content from template */
			CustomFileUtils.generateCustomBinFile("fcb.bin", folderPath, coreId, parameters);
			}
			break;
		default:
			scriptApi.logError("Unknown mode " + ModeId);
			
		return;
	}
};

// register code generation function
CodeGenerator.registerInstanceCodeGenerator(FCBgenerator);
