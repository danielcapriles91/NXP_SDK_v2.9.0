/*
 * Copyright 2020 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */
  scriptApi.requireScript("codegenerator_utilities.js");
  scriptApi.requireScript("template_engine.js");
/**
 * Function to generate FATFS application code.
 *
 * @param {ComponentInstance} componentInstance
 * @param {FunctionalGroup} functionalGroup
 * @returns {undefined}
 */
function FATFSgenerator(componentInstance, functionalGroup) {
	var coreId = functionalGroup.getCore();
	var tEngine = new TemplateEngine();
	var modeId = componentInstance.getMode().getId();
	/* Adding license to the begin of the generated code */
	var licenseTemplate = componentInstance.readComponentFile("license_txt.template");
	var codeTemplate = componentInstance.readComponentFile("ffconf_h.template");
	var generatedLicense = tEngine.generate(licenseTemplate, {});
	var folderPath = "/source/";
	
	/** Generate file for the selected mode */
	switch (modeId) {
		case "general":	
			/** Load values from component UI and apply them on the template (all template references must be defined) */
			var configSetSettings = new ComponentSettings(componentInstance.getChildById("ff_config"));		//configSet id
			var parameters = configSetSettings.loadParameters("fatfs_codegenerator");
			/** Generate content from template */
			CustomFileUtils.generateTemplateFile(codeTemplate,"ffconf.h", folderPath, coreId, parameters, generatedLicense);
			break;
		default:
			scriptApi.logError("Unknown mode " + ModeId);
		return;
	}
};

// register code generation function
CodeGenerator.registerInstanceCodeGenerator(FATFSgenerator);
