/*
 * Copyright 2017-2018 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */

var FileType = Java.type("com.nxp.swtools.utils.scripting.api.IOutWriterFactory.FileType");

// This object opens a file and writes into the file
OutputFile = function(fileName, coreId) {
    var self = this;

    // name of the generated file
    self.fileName = fileName;

    // output stream
    self.output = scriptApi.createFile(fileName, coreId, FileType.TEXT);

    // write file content and 'close' file object
    self.close = function(content) {
        self.output.write(content);
        self.fileName = "";
        self.output = null;
    }

    // 'close' file object without writing to it
    self.closeNoWrite = function() {
        self.fileName = "";
        self.output = null;
    }
}

// This object opens a binary file and writes into the file
OutputBinaryFile = function(fileName, coreId) {
    var self = this;

    // name of the generated file
    self.fileName = fileName;

    // output stream
    self.output = scriptApi.createFile(fileName, coreId, FileType.BINARY);

    // write file content and 'close' file object
    self.close = function(bytes) {
        var numOfBytes = bytes.length;
        var javaByteArray = Java.type("byte[]");
        var javaBytes = new javaByteArray(numOfBytes);
        for (var i = 0; i < numOfBytes; i++) {
            javaBytes[i] = bytes[i];
        }
        self.output.write(javaBytes);
        self.fileName = "";
        self.output = null;
    }
	
	// 'close' file object without writing to it
    self.closeNoWrite = function() {
        self.fileName = "";
        self.output = null;
    }
}

// Object contains frequently used helper functions for processing arrays, strings and comments
Utils = new function() {
    var self = this;

    // Regex for matching empty strings or strings containing non-printable characters only
    self.emptyStringRegex = new RegExp(/^\s*$/);

    // function creates a string consisting of characters defined by first argument with length defined by second argument (e. g. Utils.makeString('*', 5) will return '*****')
    self.makeString = function(character, count) {
        return Array(count + 1).join(character);
    }

    // function determines, if input string defined by argument contains no printable character (return value will be true for strings "", "  ", "  \n  " etc...)
    self.isEmpty = function(str) {
        return self.emptyStringRegex.test(str);
    }

    // function determines, if input string defined by argument contains at least one printable character (return value will be true for strings "f", "  f", "f  \n  " etc...)
    self.notEmpty = function(str) {
        return !self.isEmpty(str);
    }

    // function trims newlines from the beginning and the end of string
    self.trimNewlines = function(str) {
        return str.replace(/^\n*|\n*$/g, '');
    }

    // function creates and returns usual comment like '/* comment */'
    self.makeComment = function(content) {
        return '/* ' + content + ' */';
    }

    // function creates and returns initialization comment from array of strings defined by content in argument
    self.makeInitComment = function(content) {
        if (self.isEmpty(content)) {
            return "";
        }
        return (
            "/" +
            self.makeString("*", 119) +
            [""].concat(content).join("\n * ") +
            "\n " +
            self.makeString("*", 118) +
            "/"
        );
    }

    // function removes duplicit lines from string defined by argument
    self.removeDuplicitLines = function(str) {
        var linesArray = str.split("\n");
        var uniqueArray = linesArray.filter(function(item, pos) {
            return linesArray.indexOf(item) == pos;
        });
        return uniqueArray.join("\n");
    }

    // function will return an array containing values of object defined by argument (converts associative array to array indexed by numbers)
    self.objectValues = function(o) {
        var keys = Object.keys(o);
        values = [];
        for (var k in keys) {
            values.push(o[keys[k]]);
        }
        return values;
    }

    // function returns indentation string (spaces) of level defined by argument, tab width is set to 2 spaces by default
    self.indent = function(level) {
        var tab = "  ";
        return self.makeString(tab, level);
    }

    // function renders section of generated code consisting of a comment in header of section and its content (C source code - second argument)
    self.renderSection = function(content, sectionName) {
        if (self.isEmpty(content)) {
            return "";
        }

        if (self.isEmpty(sectionName)) {
            return content;
        }

        initComment = self.makeInitComment([sectionName]);
        return [initComment, content].join("\n");
    }

    // function wraps input string into clang-off and clang-on directives in order to ignore the fragment code by clang formatter (used for YAML sections)
    self.clangOff = function(str) {
        return self.notEmpty(str)
            ? [self.makeComment('clang-format off'), str, self.makeComment('clang-format on')].join("\n")
            : "";
    }
};

sharedResources = new function() {
    var self = this;
    // global profile object
    self.profile = scriptApi.getProfile();

    // collection of functional groups
    self.functionalGroups = self.profile.getFunctionalGroups();

    // global config set of the system component
    self.globalConfigSetSystem = null;
    if (self.profile.getComponentConfiguration("system") != null) {
        self.globalConfigSetSystem = self.profile.getComponentConfiguration("system").getGlobalConfigSet();
    } else {
        // Error is not reported because it is invalid project configuration provided by the Peripherals tool - the check is a workaround of the Config Tools V9 issue MCUXCON-7117
        //scriptApi.logError("The system component is not available in the project.");
    }

    // coresList is an array containing list of coreIds of each MCU cores, e. g.: ['core0', 'core1']
    self.coresList = Object.keys(
        JSON.parse(self.profile.getMcuInfo().getCoresList())
    );

    // flag defining, if user selected to generate YAML in GUI
    self.enableYaml = self.profile.getYaml();

    // function returns global YAML of profile together with YAML of global config sets of all components wrapped in clang-off/clang-on directives
    // if generate YAML option is disabled in GUI, returns empty string
    self.getGlobalYaml = function() {
        var componentConfigurations = self.profile.getComponentConfigurations();
        var globalYaml = self.getYaml(self.profile);

        for (var iterator = componentConfigurations.iterator(); iterator.hasNext();) {
            var componentConfiguration = iterator.next();
            globalYaml += componentConfiguration.getGlobalConfigSet()
                ? (self.getYaml(componentConfiguration) != null)
                    ? '\n\n' + self.getYaml(componentConfiguration)
                    : ""
                : "";
        }
        return Utils.clangOff(globalYaml);
    };

    // function checks, if generate YAML option is enabled in GUI and returns YAML section of element (component configuration or profile)
    // if generate YAML option is disabled in GUI, returns empty string
    self.getYaml = function(element) {
        return self.enableYaml ? element.getYaml() : "";
    };

    // string containing C comment with initial notification about manual modification of generated files (will be generated at the top of each generated files)
    self.notification = Utils.makeInitComment([
        "This file was generated by the MCUXpresso Config Tools. Any manual edits made to this file",
        "will be overwritten if the respective MCUXpresso Config Tools is used to update this file."
    ]);
};

// Object maps java ComponentInstance objects and describes all attributes and helper functions needed for generation of code related to components
ComponentDescriptor = function(componentInstance, functionalGroup) {
    var self = this;

    // name of the component
    self.name = componentInstance.getName();

    // prefix of the functional group passed to constructor
    self.prefix = functionalGroup.prefix;

    // YAML describing the component configuration
    self.yaml = Utils.clangOff(sharedResources.getYaml(componentInstance));

    // save peripheral type of the component (for example 'UART', 'ADC', 'DMA' etc...)
    self.peripheralType = (componentInstance.getPeripheral() != null) ? componentInstance.getMcu().getPeripheralType(componentInstance.getPeripheral()).toLowerCase() : 'other';

    // names of C code sections related to the component, which will be generated into peripherals.c file
    self.cFileSections = {
        global_vars: "",
        global_functions: "",
        init_function_comment: "",
        init_function_open: "\nstatic void " + self.prefix + self.name + "_init(void) {\n",
        init_function_vars: "",
        init_function_preinit3: "",
        init_function_preinit2: "",
        init_function_preinit1: "",
        init_function_preinit0: "",
        init_function_body: "",
        init_function_postinit0: "",
        init_function_postinit1: "",
        init_function_postinit2: "",
        init_function_postinit3: "",
        init_function_close: "}"
    };

    // names of C code sections related to the component, which will be generated into peripherals.h file
    self.hFileSections = {
        general_defines: "",
        includes: "",
        defines: "",
        global_vars_extern: "",
        global_functions_extern: "",
        callback_function_extern: ""
    }

    // names of C code sections related to the component, which will be generated into RTE_Device.h file
    self.rteDeviceFileSections = {
        driver_includes: "",
        driver_functions_extern: "",
        driver_name_map_defines: "",
        driver_config_defines: "",
    }

    // names of C code sections related to the component, which should be generated at the beginning or an the end of functional group body
    self.globalSections = {
        global_preinit5: "",
        global_preinit4: "",
        global_preinit3: "",
        global_preinit2: "",
        global_preinit1: "",
        global_preinit0: "",
        global_dma_preinit: "",
        global_xrdc_preinit: "",
        global_postinit0: "",
        global_postinit1: "",
        global_postinit2: "",
        global_postinit3: "",
        global_postinit4: "",
        global_postinit5: "",
        common_pre_init_function: "",
        common_post_init_function: "",
        component_pre_init: "",
        component_post_init: ""
    }

    // function returns string containing call of the init function related to the component (e. g. 'BOARD_I2C_1_init();') 
    self.renderCall = function() {
        /* component pre-init code */
        pre_init = "";
        if (self.globalSections["component_pre_init"] != "") {
          pre_init = Utils.indent(1) + self.globalSections["component_pre_init"] + "\n"
        }
        /* component post init code */
        post_init = "";
        if (self.globalSections["component_post_init"] != "") {
          post_init = "\n" + Utils.indent(1) + self.globalSections["component_post_init"]
        }
        /* call of the configuration component initialization function */
        function_call = "";
        /* if the initialization function is not empty*/
        if (!self.isInitFunctionBodyEmpty()) {
          function_call = Utils.indent(1) + self.prefix + self.name + "_init();";
        }
        return pre_init + function_call + post_init;
    }

    // function adds initial comment and component YAML section to initialization C code related to the component configuration (to be used in peripherals.c)
    self.wrap = function(mainContent) {
        return [
            Utils.makeInitComment([self.name + " initialization code"]),
            self.yaml,
            mainContent
        ].join("\n");
    }
    // Check whether the function body contain any code. When empty the function return true. 
    self.isInitFunctionBodyEmpty = function() {
      if ((self.cFileSections["init_function_vars"] === "") &&
          (self.cFileSections["init_function_preinit3"] === "") &&
          (self.cFileSections["init_function_preinit2"] === "") &&
          (self.cFileSections["init_function_preinit1"] === "") &&
          (self.cFileSections["init_function_preinit0"] === "") &&
          (self.cFileSections["init_function_body"] === "") &&
          (self.cFileSections["init_function_postinit0"] === "") &&
          (self.cFileSections["init_function_postinit1"] === "") &&
          (self.cFileSections["init_function_postinit2"] === "") &&
          (self.cFileSections["init_function_postinit3"] === "")){
        return true;
      } else {
        return false;
      }
    }

    // function returns string containing initialization C code of the component with YAML, initial comment and the source code (to be used in peripherals.c)
    self.renderInitialization = function() {
        if (componentInstance.getComment() != "") {
          self.cFileSections["init_function_comment"] = "/*!\n * @brief " + componentInstance.getComment().replace(/\n/g, "\n * ") + "\n */";
        }
        if (self.isInitFunctionBodyEmpty()) {
          /* When empty the function is commented out */
          self.cFileSections["init_function_open"] = "\n/* Empty initialization function (commented out)" + self.cFileSections["init_function_open"];
          self.cFileSections["init_function_close"] = self.cFileSections["init_function_close"] + " */";
        } 
        return self.wrap(Utils.objectValues(self.cFileSections).join(''));
    }

    // function fills file sections with corresponding code emitted by java configSet.emit function
    self.processSections = function(configSet, sections) {
        var codeEmitter = configSet.getCodeEmitter();
        for (var sectionId in sections) {
            var codeFragment = codeEmitter.emit(sectionId);
            if (Utils.notEmpty(codeFragment)) {
                sections[sectionId] += codeFragment;
            }
            // process custom section providers (if present)
            var sp = CodeGenerator.getSectionProvider(componentInstance.getType(), sectionId);
            if (sp != null) {
                // add resulting content into the section
                sections[sectionId] += sp.providerFn(componentInstance, sectionId);
            }
        };
    };    

    self.invokeInstanceGenerator = function () {
        var ig = CodeGenerator.getInstanceCodeGenerator(componentInstance);
        if (ig !== null) {
            // invoke generator, passing instance and functional group object
            ig(componentInstance, functionalGroup.getFnGroupObject());
        };
    };

    // if component instance has an error (has not valid configuration), log warning and generate comment with error into peripherals.c file
    // else fill all corresponding peripherals.h and peripherals.c file sections with C code corresponding to the component configuration
    if (componentInstance.getError()) {
        scriptApi.logWarning("Initialization code of  " + self.name + " component in " + functionalGroup.name + " functional group is not generated due to invalid configuration.");
        self.cFileSections['init_function_body'] = Utils.indent(1) + Utils.makeComment("Configuration of the component " + self.name + " of functional group " + functionalGroup.name + " is not valid.") + '\n';
    } else {
        var configSets = componentInstance.getChildren();
        for (componentSettingIndex in configSets) {
            self.processSections(configSets[componentSettingIndex], self.cFileSections);
            self.processSections(configSets[componentSettingIndex], self.hFileSections);
            self.processSections(configSets[componentSettingIndex], self.rteDeviceFileSections);
            self.processSections(configSets[componentSettingIndex], self.globalSections);
        }
    }
}

// Object maps java FunctionalGroup objects and describes all attributes and helper functions needed for generation of code related to functional groups
FunctionalGroupDescriptor = function(functionalGroup) {
    var self = this;

    // name of the functional group
    self.name = functionalGroup.getName();

    // prefix of the functional group
    self.prefix = functionalGroup.getIdPrefix();

    // flag defining, if the functional group should be called from BOARD_InitBootPeripherals() function
    self.isCalledFromDefaultInit = functionalGroup.isCalledFromDefaultInit();
    
    // Optional user's functional group description (to be used in the group init. function in defintion and declaration 
    self.descriptionDefinition = (functionalGroup.getDescription() != "") ? ("/*!\n * brief " + functionalGroup.getDescription().replace(/\n/g, "\n * ") + "\n */") : "";
    self.descriptionDeclaration = (functionalGroup.getDescription() != "") ? ("/*!\n * @brief " + functionalGroup.getDescription().replace(/\n/g, "\n * ") + "\n */") : "";

    self.getFnGroupObject = function () {
        return functionalGroup;
    };

    // empty list of component instances corresponding to the functional group - will be filled with ComponentDescriptor objects
    self.components = [];

    // function returns callings to each components corresponding to current functional group with initialization comment in header
    // returns empty string, if no component belongs to the functional group
    self.renderComponentsCalls = function() {
        if (self.components.length > 0) {
            var componentCalls = self.components.map(function(component) {
                return /*Utils.indent(1) +*/ component.renderCall();
            }).filter(Utils.notEmpty).join('\n');
            var componentsInitComment = Utils.indent(1) + Utils.makeComment('Initialize components');
            return [componentsInitComment, componentCalls].join('\n');
        }
        return '';
    }

    // function returns pre-initialization or post-initialization (defined by prefix argument - 'pre' or 'post') C code sections for functional group with initialization comment
    // returns empty string, if no global sections code is defined for the functional group
    self.renderGlobalSections = function(prefix) {
        var globalSections = self.getGlobalSections(prefix).filter(Utils.notEmpty).join('');
        var globalInitComment = Utils.indent(1) + Utils.makeComment('Global initialization');

        if (globalSections.length > 0) {
            return [globalInitComment].concat(globalSections).join('\n');
        }
        return '';
    }
    
    
   // function fills file sections with corresponding code emitted by java configSet.emit function
   self.processGlobalSections = function(configSet, sections) {
        var codeEmitter = configSet.getCodeEmitter();
        for (var sectionId in sections) {
            var codeFragment = codeEmitter.emit(sectionId);
            if (Utils.notEmpty(codeFragment)) {
                sections[sectionId] += codeFragment;
            }
        };
    };  
   // names of C code sections related to the global common section, which will be generated into initializaiton functional group only
    self.cFileCommonGlobalPreInitSections = {
        global_pre_init_only: ""
    }
    self.cFileCommonGlobalPostInitSections = {
        global_post_init_only: ""
    }
    /* rendering of pre-initialization sections */
    self.renderCommonGlobalPreInitSections = function() {
        // global sections of the system component
        self.processGlobalSections(sharedResources.globalConfigSetSystem, self.cFileCommonGlobalPreInitSections);
        /* concatenate all sections */
        var output = [];
        for (var sectionId in self.cFileCommonGlobalPreInitSections) {
            output.push(self.cFileCommonGlobalPreInitSections[sectionId]);
        }
        return output.join("\n");
    }
    /* rendering of post-initialization sections */
    self.renderCommonGlobalPostInitSections = function() {
        // global sections of the system component
        self.processGlobalSections(sharedResources.globalConfigSetSystem, self.cFileCommonGlobalPostInitSections);
        /* concatenate all sections */
        var output = [];
        for (var sectionId in self.cFileCommonGlobalPostInitSections) {
            output.push(self.cFileCommonGlobalPostInitSections[sectionId]);
        }
        return output.join("\n");
    }
    self.renderDefinition = function() {
        var groupDescription = [];
        groupDescription.push(self.descriptionDefinition);
        var open = ["void " + self.name + "(void)", "{"];
        var content = [ self.renderGlobalSections('pre'), self.renderComponentsCalls(), self.renderGlobalSections('post'),]
                       .filter(Utils.notEmpty)
                       .map(Utils.trimNewlines)
                       .join('\n\n');
        var close = ["}"];
        var commonGlobalPreInitSections = self.isCalledFromDefaultInit ? self.renderCommonGlobalPreInitSections() : '';
        var commonGlobalPostInitSections = self.isCalledFromDefaultInit ? self.renderCommonGlobalPostInitSections() : '';
        
        // global common pre-initialization function definition (common_pre_init_function of components)
        var pre_init_function_content = self.getGlobalSection("common_pre_init_function");
        var pre_init_function_definition = [];
        var pre_init_function_call = [];
        /* if any content is defined create the pre-initialization function definition and the function call*/
        if (pre_init_function_content != "") {
            pre_init_function_definition = ["static void " + self.name + "_CommonPreInit(void)",
                                             "{", 
                                             pre_init_function_content + "}\n"];
            pre_init_function_call = ["  /* Common pre-initialization */", 
                                           "  " + self.name + "_CommonPreInit();"];
        }
        // global common post-initialization function definition (common_post_init_function of components)
        var post_init_function_content = self.getGlobalSection("common_post_init_function");
        var post_init_function_definition = [];
        var post_init_function_call = [];
        /* if any content is defined create the post-initialization function definition and the function call*/
        if (post_init_function_content != "") {
            post_init_function_definition = ["static void " + self.name + "_CommonPostInit(void)",
                                             "{", 
                                             post_init_function_content + "}\n"];
            post_init_function_call = ["  /* Common post-initialization */", 
                                           "  " + self.name + "_CommonPostInit();"];
        }
        /* return the composition of common pre-initization function, post-initialization function and functional group initialization function */
        return pre_init_function_definition
            .concat(post_init_function_definition)
            .concat(groupDescription)
            .concat(open)
            .concat(commonGlobalPreInitSections)
            .concat(pre_init_function_call)
            .concat(content)
            .concat(post_init_function_call)
            .concat(commonGlobalPostInitSections)
            .concat(close)
            .filter(Utils.notEmpty)
            .join("\n");
    }

    // function returns string of the declaration of the functional group (e. g. 'void BOARD_InitPeripherals(void);')
    self.renderDeclaration = function() {
        return self.descriptionDeclaration + "\nvoid " + self.name + "(void);";
    }

    // function returns string of the functional group call (e. g. 'BOARD_InitPeripherals();')
    self.renderCall = function() {
        return self.name + "();";
    }

    // function returns string containing initialization C code of the functional group with initial comment
    // and the source code containing initialization code for all its components (to be used in peripherals.c)
    self.renderInitialization = function() {
        var componentsDefinitions = self.components
            .map(function(component) {return component.renderInitialization();})
            .join("\n\n");
        return Utils.renderSection(componentsDefinitions, self.name + " functional group");
    }

    // function returns string of processed C code section for peripherals.h file related to the functional group (e. g. returns all define directives for the functional group)
    self.getHSection = function(sectionId, comment) {
        var sectionCode = self.components
            .map(function(component) {return component.hFileSections[sectionId];})
            .join("");

        return ((Utils.notEmpty(comment) && Utils.notEmpty(sectionCode)) ? Utils.makeComment(comment) + '\n' : "") + sectionCode;
    }

    // function returns an object of processed C code sections for peripherals.h file related to the functional group
    self.getHFileSections = function() {
        return {
            general_defines: self.getHSection("general_defines", ""),
            includes: self.getHSection("includes", ""),
            defines: self.getHSection("defines", "Definitions for " + self.name + " functional group"),
            global_vars_extern: self.getHSection("global_vars_extern", ""),
            global_functions_extern: self.getHSection("global_functions_extern", ""),
            callback_function_extern: self.getHSection("callback_function_extern", "")
        };
    }

    // function returns string of processed C code section for peripherals.c file related to the functional group initialization parts called with custom priority
    self.getGlobalSection = function(sectionId) {
        return self.components
            .map(function(component) {return component.globalSections[sectionId];})
            .join("");
    }

    // function returns an object of processed C code sections for peripherals.c file related to the functional group initialization parts called with higher priority
    self.getGlobalSections = function(prefix) {
        var sections = [
            self.getGlobalSection("global_" + prefix + "init5"),
            self.getGlobalSection("global_" + prefix + "init4"),
            self.getGlobalSection("global_" + prefix + "init3"),
            self.getGlobalSection("global_" + prefix + "init2"),
            self.getGlobalSection("global_" + prefix + "init1"),
            self.getGlobalSection("global_" + prefix + "init0")
        ];

        if (prefix == 'post') {
            sections = sections.reverse();
        }
        else {
            sections = [self.getGlobalSection("global_xrdc_preinit"), self.getGlobalSection("global_dma_preinit")].concat(sections);
            /* Global common section for default initialization group only */
            if (self.isCalledFromDefaultInit) {
                sections = [self.getGlobalSection("global_common_init")].concat(sections);
            } 
        }
        return sections;
    }

    // function returns string of processed C code section for RTE_Device.h file related to the functional group (e. g. returns all define directives for the functional group)
    self.getRTEDeviceFileSection = function(sectionId, comment) {
        var sectionCode = self.components
            .map(function(component) {return component.rteDeviceFileSections[sectionId];})
            .join("");

        return ((Utils.notEmpty(comment) && Utils.notEmpty(sectionCode)) ? Utils.makeComment(comment) + '\n' : "") + sectionCode;
    }

    // function returns an object of processed C code sections for RTE_Device.h file related to the functional group
    self.getRTEDeviceFileSections = function() {
        return {
            driver_includes: self.getRTEDeviceFileSection("driver_includes", ""),
            driver_functions_extern: self.getRTEDeviceFileSection("driver_functions_extern", ""),
            driver_name_map_defines: self.getRTEDeviceFileSection("driver_name_map_defines", ""),
            driver_config_defines: self.getRTEDeviceFileSection("driver_config_defines", "")
        };
    }

    self.invokeInstanceGenerators = function() {
        self.components.forEach(
                function(comp) {
                    comp.invokeInstanceGenerator();
                }
            );
    }

    // Main initialization
    // get functional group component instances from scriptAPI
    var componentInstances = functionalGroup.getComponentInstances();
    // map scriptAPI component instances objects to ComponentDescriptor objects and fill components list with them
    for (componentInstanceIndex in componentInstances) {
        self.components.push(new ComponentDescriptor(componentInstances[componentInstanceIndex], self));
    }
}

// functional groups will be filled from main() function for each core separatelly
// TODO - refactor and remove this
var functionalGroupsMapper;

// Object maps functional groups corresponding to core defined by argument into a list of FunctionalGroupDescirptor objects
FunctionalGroupsMapper = function(coreId) {
    var self = this;

    // empty list of functional group instances corresponding to the core - will be filled with FunctionalGroupDescirptor objects
    self.functionalGroups = [];

    // function maps scriptAPI functional group objects to FunctionalGroupDescriptor objects and fills functionalGroups list with them
    self.processFunctionalGroups = function() {
        var functionalGroupsInstances = sharedResources.functionalGroups;
        for (functionalGroupIndex in functionalGroupsInstances) {
            var functionalGroup = functionalGroupsInstances[functionalGroupIndex];
            if (functionalGroup.getCore() == coreId) {
                self.functionalGroups.push(new FunctionalGroupDescriptor(functionalGroup));
            }
        }
    };
    
    /** Invokes custome code generators (if present)
     * @returns {undefined}
     */
    self.invokeInstanceGenerators = function() {
        self.functionalGroups.forEach(
                function(fg) { 
                   fg.invokeInstanceGenerators();   
                }
            );
        return;
    };

    // map scriptAPI functional group objects to FunctionalGroupDescriptor objects and fill functionalGroups list with them
    self.processFunctionalGroups();
}

// Object assembles parts of generated peripherals.h file
HFileDescriptor = function() {
    var self = this;

    // string containing an initial part of peripherals.h file
    self.head = ["#ifndef _PERIPHERALS_H_", "#define _PERIPHERALS_H_"].join("\n");

    // string containing a declaration of BOARD_InitBootPeripherals() function with its initial comment
    self.initBoot = [
        Utils.makeInitComment(["BOARD_InitBootPeripherals function"]),
        "void BOARD_InitBootPeripherals(void);"
    ].join("\n");

    // string containing a closing part of peripherals.h file
    self.tail = ['#if defined(__cplusplus)',
                 '}',
                 '#endif',
                 '',
                 '#endif /* _PERIPHERALS_H_ */'
                 ].join('\n');

    // function adds a notification, initial and closing parts of the peripherals.h file content (defined by argument) and returns wrapped content of the file
    self.wrap = function(mainContent) {
        return [
            sharedResources.notification,
            self.head,
            mainContent,
            self.initBoot,
            self.tail
        ].join("\n\n");
    };

    self.groupSections = function(sectionsArray, sectionId) {
        return sectionsArray
            .map(function(functionalGroupSection) {return functionalGroupSection[sectionId];})
            .join("");
    }

    // names of C code sections related to the component, which will be generated into peripherals.h file
    self.hFileGlobalSections = {
        user_defines: "",
        user_includes: "",
        includes: ""
    }
    
    // function fills file sections with corresponding code emitted by java configSet.emit function
    self.processGlobalSections = function(configSet, sections) {
        var codeEmitter = configSet.getCodeEmitter();
        for (var sectionId in sections) {
            var codeFragment = codeEmitter.emit(sectionId);
            if (Utils.notEmpty(codeFragment)) {
                sections[sectionId] += codeFragment;
            }
        };
    }; 


    // function collects all code fragments in sections of the peripherals.h file from functional groups mapper array and returns final content of the file
    self.render = function() {
        // collect all sections of the peripherals.h file from all functional groups, then group the same sections from all functional groups
        var sectionsArray = functionalGroupsMapper.functionalGroups.map(function(functionalGroup) {
            return functionalGroup.getHFileSections();
        });

        // group declarations of all functional groups
        var initFunctions = functionalGroupsMapper.functionalGroups
            .map(function(functionalGroup) {return functionalGroup.renderDeclaration();})
            .join("\n");

        // group general define directives from all functional groups
        var general_defines = self.groupSections(sectionsArray, 'general_defines');

        // global sections of the system component
        self.processGlobalSections(sharedResources.globalConfigSetSystem, self.hFileGlobalSections);
        var user_includes = self.hFileGlobalSections['user_includes'];
        var user_defines = self.hFileGlobalSections['user_defines'];

        // group include directives from all functional groups and global section of the system component
        var includes = self.groupSections(sectionsArray, 'includes') + self.hFileGlobalSections['includes'];

        // group define directives from all functional groups
        var defines = sectionsArray
            .map(function(functionalGroupSection) {return functionalGroupSection['defines'];})
            .filter(Utils.notEmpty)
            .join("\n");

        // group all extern global variables from all functional groups
        var globalVarsExtern = self.groupSections(sectionsArray, 'global_vars_extern');
        
         // group all global function from all functional groups
        var globalFunctionsExtern = self.groupSections(sectionsArray, 'global_functions_extern');

        // group all extern callback functions from all functional groups
        var callbackFunctionExtern = self.groupSections(sectionsArray, 'callback_function_extern');

        var cppSections = [
            '#if defined(__cplusplus)',
            'extern "C" {',
            '#endif /* __cplusplus */',
            ''
        ].join('\n');

        // assembly collected sections and return final content of the peripherals.h file
        output = self.wrap(
            [
                Utils.renderSection(Utils.removeDuplicitLines(general_defines), "General definitions"),
                Utils.renderSection(user_includes, "User includes"),
                Utils.renderSection(Utils.removeDuplicitLines(includes), "Included files"),
                cppSections,
                Utils.renderSection(user_defines, "User definitions"),
                Utils.renderSection(defines, "Definitions"),
                Utils.renderSection(globalVarsExtern, "Global variables"),
                Utils.renderSection(globalFunctionsExtern, "Global functions"),
                Utils.renderSection(callbackFunctionExtern, "Callback functions"),
                Utils.renderSection(initFunctions, "Initialization functions")
            ]
            .filter(Utils.notEmpty)
            .join("\n")
            );
        return output;
    };
};

// Object assembles parts of generated peripherals.c file
CFileDescriptor = function() {
    var self = this;

    // function adds a notification and initial parts of the peripherals.c file content (defined by argument) and returns wrapped content of the file
    self.wrap = function(mainContent) {
        return [sharedResources.notification, sharedResources.getGlobalYaml()]
            .concat(mainContent)
            .filter(Utils.notEmpty)
            .join("\n\n");
    };

    // function assembles and returns a final content of the peripherals.c file from its parts
    // (inludes, functional groups initializations, functional groups definitions and boot fucntions)
    self.render = function() {
        var output;
        output = self.wrap([
            Utils.renderSection(self.includes, "Included files"),
            Utils.renderSection(self.functionalGroupsInitializations, ""),
            Utils.renderSection(self.initFunctions, "Initialization functions"),
            Utils.renderSection(self.initBootFunction, "BOARD_InitBootPeripherals function")
            ]);                
        return output;
    };

    // string representing all include directives generated to peripherals.c file
    self.includes = '#include "peripherals.h"';

    // get definitions of all functional groups
    self.initFunctions = functionalGroupsMapper.functionalGroups
        .map(function(functionalGroup) {return functionalGroup.renderDefinition();})
        .join("\n\n");

    // get initializations of all functional groups
    self.functionalGroupsInitializations = functionalGroupsMapper.functionalGroups
        .map(function(functionalGroup) {return functionalGroup.renderInitialization();})
        .filter(Utils.notEmpty)
        .join("\n\n");

    // get a definition of BOARD_InitBootPeripherals() function (head and body with all functional groups calls selected by user in GUI)
    self.initBootFunction = ["void BOARD_InitBootPeripherals(void)", "{"]
        .concat(functionalGroupsMapper.functionalGroups
                    .filter(function(functionalGroup) {return functionalGroup.isCalledFromDefaultInit;})
                    .map(function(functionalGroup) {return Utils.indent(1) + functionalGroup.renderCall();}))
        .concat(["}"])
        .join("\n");
};

// Object assembles parts of RTE_Device.h file
RTE_DeviceFileDescriptor = function() {
    var self = this;

    // string containing an initial part of RTE_Device.h file
    self.head = ["/*",
                 " * Copyright 2018-" + (new Date()).getFullYear() +" NXP",
                 " * All rights reserved.",
                 " *",
                 " * SPDX-License-Identifier: BSD-3-Clause",
                 " */",
                 "",
                 "#ifndef __RTE_DEVICE_H",
                 "#define __RTE_DEVICE_H"
                ].join("\n");

    // string containing a closing part of RTE_Device.h file
    self.tail = [
                 '#endif /* __RTE_DEVICE_H */'
                 ].join('\n');

    // function adds a notification, initial and closing parts of the RTE_Device.h file content (defined by argument) and returns wrapped content of the file
    self.wrap = function(mainContent) {
        var strWrap = ((mainContent != "")?  
            [
                sharedResources.notification,
                self.head,
                mainContent,
                self.tail
            ].join("\n\n")
            :
            "");
        return strWrap;
    };

    self.groupSections = function(sectionsArray, sectionId) {
        return sectionsArray
            .map(function(functionalGroupSection) {return functionalGroupSection[sectionId];})
            .join("");
    }

    // function collects all code fragments in sections of the RTE_Device.h file from functional groups mapper array and returns final content of the file
    self.render = function() {
        // collect all sections of the RTE_Device.h file from all functional groups, then group the same sections from all functional groups
        var sectionsArray = functionalGroupsMapper.functionalGroups.map(function(functionalGroup) {
            return functionalGroup.getRTEDeviceFileSections();
        });

        // group driver_includes directives from all functional groups
        var driver_includes = sectionsArray
        .map(function(functionalGroupSection) {return functionalGroupSection['driver_includes'];})
        .filter(Utils.notEmpty)
        .join("\n");

        // group driver_functions_extern directives from all functional groups
        var driver_functions_extern = sectionsArray
            .map(function(functionalGroupSection) {return functionalGroupSection['driver_functions_extern'];})
            .filter(Utils.notEmpty)
            .join("\n");

        // group driver_name_map_defines directives from all functional groups
        var driver_name_map_defines = sectionsArray
            .map(function(functionalGroupSection) {return functionalGroupSection['driver_name_map_defines'];})
            .filter(Utils.notEmpty)
            .join("\n");

        // group driver_config_defines directives from all functional groups
        var driver_config_defines = sectionsArray
            .map(function(functionalGroupSection) {return functionalGroupSection['driver_config_defines'];})
            .filter(Utils.notEmpty)
            .join("\n");

        // assembly collected sections and return final content of the RTE_Device.h file
        output = self.wrap(
            [
                Utils.renderSection(Utils.removeDuplicitLines(driver_includes), "Included files"),
                Utils.renderSection(driver_functions_extern, "Global functions"),
                Utils.renderSection(driver_name_map_defines, "Driver name mapping"),
                Utils.renderSection(driver_config_defines, "Driver configuration"),
            ]
            .filter(Utils.notEmpty)
            .join("\n")
            );
        return output;
    };
};

ConfigDataUtils = new function() {
    /** Method returning list of functional groups for given core
     * @param coreID - Identifier of the core
     * @returns Array of functional group objects
     */    
    this.fnGroupsForCore = function (coreID) {
        var output = [];
        var fnGroups = sharedResources.functionalGroups;
        for (var functionalGroupIndex in fnGroups) {
            var functionalGroup = fnGroups[functionalGroupIndex];
            if (functionalGroup.getCore() === coreID) {
                output.push(functionalGroup);
            }            
        }        
        return output;
    };
};

var _currentComponent = null; // global variable tracking which component is initialized
var _currentScriptFolder = null;

// singleton CodeGenerator object
var CodeGenerator = new function() {
    var self = this;
    // array of custom generators
    var fileGenerators = [];
    var sectionProviders = [];
    var instanceGenerators = [];
    
    /** Registers new custom file generator
     * Use this in case of generating fixed file independent on number 
     * or presence instances of the instances.
     * @param filePath - relative path to the generated file
     * @param fileGeneratorFn - function returning content of the file
     */
    self.registerFileGenerator = function (filePath, fileGeneratorFn) {        
        fileGenerators.push({                   
                   filePath : filePath,
                   genFn : fileGeneratorFn
               });       
       return;
    };
    
    /* register function providing custom content for section. This provider 
     * will be invoked every for every instance when the content is needed.
     * 
     * @param  sections - array of section ids, handled by the provider
     * @param providerFn - function returning string with section content
     */
    self.registerSectionProvider = function (sections, providerFn) {
        // create empty array for this component if it hasn't any provider
        if (sectionProviders[_currentComponent] == null) {
            sectionProviders[_currentComponent] = [];
        }
        sections.forEach(
                function (section) {
                    sectionProviders[_currentComponent][section] = 
                    {
                        sectionId: section,
                        providerFn: providerFn
                    };
                }
        );
        return;
    };
    /** Returns section provider for given component and section
     * 
     * @param component type ID
     * @param sectionId
     * @returns {CodeGenerator.codegeneratorCodeGenerator.getSectionProvider.out}
     */
    this.getSectionProvider = function(component, sectionId)  {
        var out = null;
        if (sectionProviders[component] !== undefined) {
            out = sectionProviders[component][sectionId];                
            if (out === undefined) {
                out = null;
            }
        }
        return out;
    };
    
    /** Registers function called for every instance of the component
     * This function has to completely handle file creation and content writing itself
     * 
     * @param instanceGeneratorFn - function to be called with 2 paramters: instance and functional group objects
     */
    this.registerInstanceCodeGenerator = function (instanceGeneratorFn) {
        instanceGenerators[_currentComponent] = instanceGeneratorFn;
        return;
    };

    this.getInstanceCodeGenerator = function (componentInstance) {
        var out = null;
        if (componentInstance !== null && instanceGenerators[componentInstance.getType()] !== undefined) {
            out = instanceGenerators[componentInstance.getType()]; 
        }
        return out;
    };
    
    /** Launches all custom scripts for all used components allowing them
     * to register custom file generator(s).
     */
    this.launchUsedComponentScripts = function() {
        var profile = scriptApi.getProfile();
        var components = profile.getComponentConfigurations();
        components.forEach(
            function(c) {
                if (c.getId() !== 'system') {
                    var scriptfile = c.getScriptFile(); 
                    if (scriptfile !== "") {                                                        
                        _currentComponent = c.getId();
                        // remove filename from folder
                        _currentScriptFolder = scriptfile.replace(/[^\\\/]*$/, "");
                        // load and execute script
                        scriptApi.requireScript(scriptfile);
                    }    
                }
            }
        );
        _currentComponent = null;;
    };
    
    /** generates content of all files for given core by executing file 
     * generator functions.
     * 
     * @param coreId - ID of the core
     */
    this.generateAllFiles = function(coreId) {

        fileGenerators.forEach(
            function (fg) {
                var output = fg.genFn();
                if (output !== null) {
                    new OutputFile(fg.filePath, coreId).close(output);
                } 
            }
        );   
    };
   
};


// main function will iterate over all MCU cores, creates list of corresponding functional groups and if it is not empty, generates peripherals.c/.h source files
function main() {
        
    // Load and execute custom scripts
    CodeGenerator.launchUsedComponentScripts();
    
    if (sharedResources.globalConfigSetSystem != null) {
        // iterate cores
        for (var coreIndex = 0; coreIndex < sharedResources.coresList.length; coreIndex++) {
            var coreId = sharedResources.coresList[coreIndex];
            // prepare FunctionalGroupDescriptor objects only for current core
            // TODO - refactor to remove it as global variable
            functionalGroupsMapper = new FunctionalGroupsMapper(coreId);
            if (functionalGroupsMapper.functionalGroups.length > 0) {
                new OutputFile("peripherals.c", coreId).close(new CFileDescriptor().render());
                new OutputFile("peripherals.h", coreId).close(new HFileDescriptor().render());
                var sRTE_Device_Output = new RTE_DeviceFileDescriptor().render();
                if (sRTE_Device_Output != "") {
                    new OutputFile("RTE_Device.h", coreId).close(sRTE_Device_Output);
                }
            }
            // generate all custom files content
            CodeGenerator.generateAllFiles(coreId);
            // invoke custom instance generators of components
            functionalGroupsMapper.invokeInstanceGenerators();
        }
    }
}

// generation script entry point
main();
