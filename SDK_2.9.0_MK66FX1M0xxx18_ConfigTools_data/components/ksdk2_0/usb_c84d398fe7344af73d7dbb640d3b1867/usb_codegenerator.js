/*
 * Copyright 2016 Freescale Semiconductor
 * Copyright 2016-2019 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */
scriptApi.requireScript(_currentScriptFolder + "usb_constants.js");
scriptApi.requireScript(_currentScriptFolder + "templatingengine.js");
scriptApi.requireScript(_currentScriptFolder + "usb_processor_specifics.js");

/* Global variable with default indent */
var defaultIndent = "    "; 

/**
 * Function parse index from string. The index must be a number at the end of the string.
 *
 * @param {String} str with index at the end
 * @returns {Number} index
 */
function parseIndex(str) {
	return parseInt(str.match(/\d+(?!.*\d+)/g)[0]);
}

/**
 * Class allowing to read settings values from component instance
 * Constructor
 *
 * @param parent component instance or structure setting
 */
function SettingsProvider(parent) {
	var self = this;

	/** Retrieves setting label that is an integer index
	 *
	 * @returns index
	 */
	self.getIndex = function () {
		return parseInt(parent.getUiName(), 10);
	};

	/** Retrieves setting with id relative to parent
	 *
	 * @param {type} id relative to parent setting
	 * @returns setting object
	 */
	self.getSetting = function (id) {
		var setting = parent.getChildById(id);
		if (!setting) {
			scriptApi.logError("Setting `" + id + "` not found.");
		}
		return setting;
	};

	/** Retrieves setting with id relative to parent or return null
	 *
	 * @param {type} id relative to parent setting
	 * @returns setting object
	 */
	self.getChild = function (id) {
		var setting = parent.getChildById(id);
		return setting;
	};

	/** Retrieves true if the setting with id relative to parent exists and it is available and enabled
	 *
	 * @param {type} id relative to parent setting
	 * @returns true if the setting exists and the child is available
	 */
	self.isChildAvailable = function (id) {
		var setting = parent.getChildById(id);
		if (setting != null) {
		    return (setting.isAvailable() && setting.isEnabled())
		}
		return false;
	};

	/** Retrieves value for setting determined by ID
	 *
	 * @param {type} id in the form of configSetID.settingId.subSettingId
	 * @returns {undefined}
	 */
	self.valueOf = function (id) {
	    var setting = self.getSetting(id);
	    if (setting !== null) {
    	    var sp = new SettingsProvider(setting);
    	    return sp.getValue();
        } else {
            return null;
        }
	};

	/** Retrieves enumeration item value (value attribute content) of the specified enum item setting
	 *
	 * @param {type} id relative to parent setting
	 * @returns enumeration value as a string
	 */
	self.enumItemValueOf = function (id) {
		var setting = self.getSetting(id);
		var value = null;
		var enumValue = null;
		if (setting !== null) {
			var type = setting.getTypeName();
			if (type == "enum") {
			  value = setting.getValue();
              // enumValue = setting.getModelData().getItem(value).getValue(); // it does not support the dynamic enum type
              var customValue = (value.indexOf("custom") >= 0); // check if the value is a custom value
              var enumItems = setting.getEnumItems();
              // if the custom value is selected the value is in the last item of array.
              if (customValue) {
                  enumValue = enumItems[enumItems.length-1].value;
              } else {
                  // find the value according to the id (value)
                  var index = 0;
                  while((index < enumItems.length) && (enumItems[index].id != value)) {
                      index++;
                  }
                  if (index < enumItems.length) {
                      enumValue = enumItems[index].value;
                  }
              }
			  //parent.getChildById("synchronization").getModelData().getItem("kAsynchronous").getValue()
			} else {
			    value = "N/A";
			    scriptApi.logError("Illegal access to non-enumeration type by enumItemValue() in setting: " + id);
			}
		} else {
			scriptApi.logError("Cannot find setting: " + id);
		}
		return enumValue;
	};

	/**
	 * Retrieves index in array of an array item.
	 *
	 * @returns {Number} index in the array
	 */
	self.getArrayItemIndex = function () {
		return parseIndex(parent.getId());
	};

	/**
	 * Get's peripheral.
	 *
	 * @returns {String}
	 */
	self.getPeripheral = function () {
		return parent.getPeripheral();
	};

	/** Method allowing to process members of array, structure or set settings to javascript object
	 *
	 * @param  arraySettingId ID of array or structure setting
	 * @param  itemMapper function converting setting to value, if returns null, item is skipped
	 * @returns array of results returned by itemMapper
	 */
	self.processArray = function (arraySettingId, itemMapper) {
		var out = [];
		var arr = self.getSetting(arraySettingId);
		if (arr !== null) {
			arr.getChildren().forEach(
				function (item) {
					var vp = new SettingsProvider(item);
					// call item mapper and pass value provide object
					var itemResult = itemMapper(vp);
					if (itemResult !== null) {
						out.push(itemResult);
					}
				}
			);
		} else {
			scriptApi.logError("Array not found : " + arraySettingId);
		}
		return out;
	};

	/** Method allowing to process items of this array, structure or set settings to javascript object
	 *
	 * @param  itemMapper function converting setting to value, if returns null, item is skipped
	 * @returns array of results returned by itemMapper
	 */
	self.processChildren = function (itemMapper) {
		var out = [];
		parent.getChildren().forEach(
			function (item) {
				var vp = new SettingsProvider(item);
				// call item mapper and pass value provide object
				var itemResult = itemMapper(vp);
				if (itemResult !== null) {
					out.push(itemResult);
				}
			}
		);
		return out;
	};

	/**
	 * Get's length of an array.
	 *
	 * @param {String} id of the array
	 * @returns {Number} array length
	 */
	self.getArrayLength = function (id) {
		var arr = self.getSetting(id);
		var children = arr.getChildren();
		return children.length;
	};

	/**
	 * Get ID of the current setting - parent.
	 *
	 * @returns {ID} identifier of the current setting
	 */
	self.getID = function(id) {
		var ID = parent.getId();
		return ID;
	};

	/** Retrieves item value for current item of the set or null (the item is not enabled)
	 *
	 * @returns {value} value of the setting
	 */
    self.getEnumItemValue = function(settingSp) {
        var setValue = settingSp.getValue();
        if (setValue) {
            return settingSp.getItemValue(); // return value of the set item
        } else {
            return null;
        }
    }

	/** Retrieves value for current setting
	 *
	 * @returns {value} value of the setting
	 */
	self.getValue = function() {
		var type = parent.getTypeName();
		if (type == "set") {
		    var out = [];
		    /* process all items of set and provide an array of all enabled items*/
		    parent.getChildren().forEach(
			    function (item) {
			    	var vp = new SettingsProvider(item);
				    // call item mapper and pass value provide object
				    var itemResult = self.getEnumItemValue(vp);
				    if (itemResult !== null) {
					    out.push(itemResult);
				    }
			    });
            // if the set (returned array) does not contain any value return one zero value (size of the array is 1)
			if (out.length == 0) {
			    out.push(0);
			}
		    return out;
		}
		var value = parent.getValue();
		// do value conversions if necessary
		switch (type) {
			case "integer":
				value = value.intValue();
				break;
			// items supported without conversion
			case "enum":
              	if (parent.isOptionSet("use_enum_value")) { // provide the enum item value only for settings the use value attribute (it is neccessary for the dynamic enum custom values)
              	    var customValue = (value.indexOf("custom") >= 0);
              	    var enumItems = parent.getEnumItems();
              	    // if the custom value is selected the value is in the last item of array.
              	    if (customValue) {
              	        value = enumItems[enumItems.length-1].value;
              	    } else {
              	        // find the value according to the id (value)
                  	    var index = 0;
                  	    while((index < enumItems.length) && (enumItems[index].id != value)) {
                  	        index++;
                  	    }
                  	    if (index < enumItems.length) {
                  	        value = enumItems[index].value;
                  	    }
              	    }
              	}
          		break;
			case "bool":
				// intentional fall through
				break;
			case "variable":
				// intentional fall through
				break;
			case "string":
				break;
			case null:
			    // this setting is a set item
				break;
			default:
				scriptApi.logWarning("Access to non-scalar value: " + id + " : " + setting.getTypeName());
				break;
		}
		return value;
	};

	/** Retrieves value for current item of enumeration (set)
	 *
	 * @returns {value} value of the item
	 */
	self.getItemValue = function() {
  		var value = parent.getItem().getValue();
		return value;
	};

	if (!parent) {
		scriptApi.logError("Invalid parameter `" + parent + "` passed to SettingsProvider constructor.");
	}
}

/**
 * Reads protocol from setting provider.
 *
 * @param {SettingProvider} settingProvider
 * @returns {String} protocol in lower case
 */
function readProtocol(settingProvider) {
	return enumItemToStr(settingProvider, "protocol", "kProtocol".length);
}

/**
 * Reads class from setting provider.
 *
 * @param {SettingProvider} settingProvider
 * @returns {String} class in lower case
 */
function readClass(settingProvider) {
	return enumItemToStr(settingProvider, "interface_class", "kClass".length);
}

/**
 * Reads class ID from setting provider (ID is provided as the value of the interface_class_t enum value).
 *
 * @param {SettingProvider} settingProvider
 * @returns {String} class in lower case
 */
function readClassId(settingProvider) {
	return settingProvider.enumItemValueOf("interface_class").toLowerCase();
}


/**
 * Retrieves subclass from setting provider.
 *
 * @param {SettingProvider} settingProvider
 * @returns {String} subclass in lower case
 */
function readSubClass(settingProvider) {
	return enumItemToStr(settingProvider, "subclass", "kSubclass".length);
}

/**
 * Retrieves setting from setting provider and slices it.
 *
 * @param {SettingProvider} settingProvider
 * @param {String} id of the setting
 * @param {Number} slice number of characters to be sliced from the beginning of the enum value
 * @returns {String} sliced enum value
 */
function enumItemToStr(settingProvider, id, slice) {
	return settingProvider.valueOf(id).slice(slice).toLowerCase();
}

/**
 * Function used for for processing of audio units in the compoennt. This object is created based on information read from USB component.
 *
 * @param {settingProvider} instance of audio units array in the interface
 * @returns {Object} descriptor
 */
function AudioUnitConfig(settingProvider) {
    var self = this;
    var audioUnits = settingProvider;
    var audioControlInterface = [];
    var audioControlInterfaceHeader = null;
    /* USB types that are used for defined items of descriptors */
    var usbTypes = { byte_t : 1, word_t : 2};

    /**
     * Function for creating of audio control class specfic header descriptor.
     * It stores the header into the audioControlInterfaceHeader variable of the AudioUnitConfig.
     *
     * @param {list} list of all audio stream interfaces
     * @param {interface_ID} id of the current interface for definition of identifiers
     */
    self.createAudioControlInterfaceHeader = function(list, interface_ID) {
		// Create the total length of all class specific interfaces expression
		var interfaces_length_expr = "(USB_" + interface_ID + "_CONTROL_INTERFACE_HEADER_LENGTH";
		for (var i = 0; i < audioControlInterface.length; i++) {
		    interfaces_length_expr += " + " + audioControlInterface[i].bLength.id;
		}
		interfaces_length_expr += ")";

        audioControlInterfaceHeader = {
            bLength : {id : ("USB_" + interface_ID + "_CONTROL_INTERFACE_HEADER_LENGTH"), value : (0x08 + list.length), declaration: true, type : usbTypes.byte_t},
            bDescriptorType : {id : "USB_DESCRIPTOR_TYPE_AUDIO_CS_INTERFACE" , value : 0x24, declaration: false, type : usbTypes.byte_t},
            bDescriptorSubtype : {id : "USB_DESCRIPTOR_SUBTYPE_AUDIO_CONTROL_HEADER", value : 0x01, declaration: false, type : usbTypes.byte_t},
            bcdADC : {id : ("USB_" + interface_ID + "_AUDIO_DEVICE_CLASS_SPECIFICATION_VERSION"), value : 0x0100, declaration: true, type : usbTypes.word_t},
            wTotalLength : {id : ("USB_" + interface_ID + "_CONTROL_INTERFACE_TOTAL_LENGTH"), value : interfaces_length_expr, declaration: true, type : usbTypes.word_t},
            bInCollection : {id : ("USB_" + interface_ID + "_CONTROL_INTERFACE_AS_COLLECTION_NUMBER"), value : list.length, declaration: true, type : usbTypes.byte_t}
        };
		for (var i = 0; i < list.length; i++) {
		    audioControlInterfaceHeader["baInterfaceNr" + i] = {id : ("USB_" + list[i].idSnakeCase + "_CONTROL_INTERFACE_AS_COLLECTION_NUMBER"), value : list[i].index, declaration: true, type : usbTypes.byte_t};
		}
        return;
    }

    /** Retrieves item value for current item of the set or null (the item is not enabled)
	 *
	 * @returns {value} value of the setting
	 */
    self.getEnumItemValue = function(settingSp) {
        var setValue = settingSp.getValue();
        if (setValue) {
            return settingSp.getItemValue(); // return ID of the set item
        } else {
            return null;
        }
    }

    /**
     * Function for processing of input terminal unit. It returns the filled structure of input terminal for further processing.
     *
     * @param {inputTerminalSetting} parent node of the input terminal
     * @param {interface_ID} id of the current interface for definition of identifiers
     * @returns {object} input terminal structure
     */
    self.processInputTerminal = function(inputTerminalSetting, interface_ID) {
        var inputTerminal = new SettingsProvider(inputTerminalSetting);

        terminal_ID = inputTerminal.valueOf("bTerminalID");
        var inputTerminalStruct = {
            bLength : {id : ("USB_" + interface_ID + "_CONTROL_INPUT_TERMINAL_" + terminal_ID + "_LENGTH"), value : 12, declaration: true, type : usbTypes.byte_t},
            bDescriptorType : {id : "USB_DESCRIPTOR_TYPE_AUDIO_CS_INTERFACE" , value : 0x24, declaration: false, type : usbTypes.byte_t},
            bDescriptorSubtype : {id : "USB_DESCRIPTOR_SUBTYPE_AUDIO_CONTROL_INPUT_TERMINAL", value : 0x02, declaration: false, type : usbTypes.byte_t},
            bTerminalID : {id : ("USB_" + interface_ID + "_CONTROL_INPUT_TERMINAL_" + terminal_ID + "_ID"), value : inputTerminal.valueOf("bTerminalID"), declaration: true, type : usbTypes.byte_t},
            wTerminalType : {id : ("USB_" + interface_ID + "_CONTROL_INPUT_TERMINAL_" + terminal_ID + "_TYPE"), value : inputTerminal.enumItemValueOf("wTerminalType"), declaration: true, type : usbTypes.word_t},
            bAssocTerminal : {id : "USB_INTERFACE_AUDIO_CONTROL_INPUT_TERMINAL_NO_ASSOCIATION", value : 0x0, declaration: false, type : usbTypes.byte_t},
            bNrChannels : {id : ("USB_" + interface_ID + "_CONTROL_INPUT_TERMINAL_" + terminal_ID + "_CHANNELS_NUMBER"), value : inputTerminal.valueOf("bNrChannels"), declaration: true, type : usbTypes.byte_t},
            wChannelConfig : {id : ("USB_" + interface_ID + "_CONTROL_INPUT_TERMINAL_" + terminal_ID + "_CHANNELS_CONFIG"), value : inputTerminal.valueOf("wChannelConfig").join(" | "), declaration: true, type : usbTypes.word_t},
            iChannelNames : {id : "USB_NO_STRING_DESCRIPTION", value : 0x0, declaration: false, type : usbTypes.byte_t},
            iTerminal : {id : "USB_NO_STRING_DESCRIPTION", value : 0x0, declaration: false, type : usbTypes.byte_t}
        };
        return inputTerminalStruct;
    }

    /**
     * Function for processing of output terminal unit. It returns the filled structure of output terminal for further processing.
     *
     * @param {outputTerminalSetting} parent node of the output terminal
     * @param {interface_ID} id of the current interface for definition of identifiers
     * @returns {object} output terminal structure
     */
    self.processOutputTerminal = function(outputTerminalSetting, interface_ID) {
        var outputTerminal = new SettingsProvider(outputTerminalSetting);

        terminal_ID = outputTerminal.valueOf("bTerminalID");
        var outputTerminalStruct = {
            bLength : {id : ("USB_" + interface_ID + "_CONTROL_OUTPUT_TERMINAL_" + terminal_ID + "_LENGTH"), value : 9, declaration: true, type : usbTypes.byte_t},
            bDescriptorType : {id : "USB_DESCRIPTOR_TYPE_AUDIO_CS_INTERFACE" , value : 0x24, declaration: false, type : usbTypes.byte_t},
            bDescriptorSubtype : {id : "USB_DESCRIPTOR_SUBTYPE_AUDIO_CONTROL_OUTPUT_TERMINAL", value : 0x03, declaration: false, type : usbTypes.byte_t},
            bTerminalID : {id : ("USB_" + interface_ID + "_CONTROL_OUTPUT_TERMINAL_" + terminal_ID + "_ID"), value : outputTerminal.valueOf("bTerminalID"), declaration: true, type : usbTypes.byte_t},
            wTerminalType : {id : ("USB_" + interface_ID + "_CONTROL_OUTPUT_TERMINAL_" + terminal_ID + "_TYPE"), value : outputTerminal.enumItemValueOf("wTerminalType"), declaration: true, type : usbTypes.word_t},
            bAssocTerminal : {id : "USB_INTERFACE_AUDIO_CONTROL_OUTPUT_TERMINAL_NO_ASSOCIATION", value : 0x0, declaration: false, type : usbTypes.byte_t},
            bSourceID : {id : ("USB_" + interface_ID + "_CONTROL_OUTPUT_TERMINAL_" + terminal_ID + "_SOURCE_ID"), value : outputTerminal.valueOf("bSourceID"), declaration: true, type : usbTypes.byte_t},
            iTerminal : {id : "USB_NO_STRING_DESCRIPTION", value : 0x0, declaration: false, type : usbTypes.byte_t}
        };
        return outputTerminalStruct;
    }

    /**
     * Function for processing of feature unit. It returns the filled structure of feature for further processing.
     *
     * @param {featureUnitSetting} parent node of the feature
     * @param {interface_ID} id of the current interface for definition of identifiers
     * @returns {object} feature structure
     */
    self.processFeatureUnit = function(featureUnitSetting, interface_ID) {
        var featureUnit = new SettingsProvider(featureUnitSetting);
        var bmaControlsList = [];
        unit_ID = featureUnit.valueOf("bUnitID");
        var featureUnitStruct = {
            bLength : {id : ("USB_" + interface_ID + "_CONTROL_FEATURE_UNIT_" + unit_ID + "_LENGTH"), value : featureUnit.valueOf("bLength"), declaration: true, type : usbTypes.byte_t},
            bDescriptorType : {id : "USB_DESCRIPTOR_TYPE_AUDIO_CS_INTERFACE" , value : 0x24, declaration: false, type : usbTypes.byte_t},
            bDescriptorSubtype : {id : "USB_DESCRIPTOR_SUBTYPE_AUDIO_CONTROL_FEATURE_UNIT", value : 0x06, declaration: false, type : usbTypes.byte_t},
            bUnitID : {id : ("USB_" + interface_ID + "_CONTROL_OUTPUT_TERMINAL_" + unit_ID + "_ID"), value : featureUnit.valueOf("bUnitID"), declaration: true, type : usbTypes.byte_t},
            bSourceID : {id : ("USB_" + interface_ID + "_CONTROL_OUTPUT_TERMINAL_" + unit_ID + "_SOURCE_ID"), value : featureUnit.valueOf("bSourceID"), declaration: true, type : usbTypes.byte_t},
            //bControlSize - size of bmaControls in byte (i.e. when the D8 and D9 bits are set, the size is 2 otherwise it is 1)
            bControlSize : {id : ("USB_" + interface_ID + "_CONTROL_OUTPUT_TERMINAL_" + unit_ID + "_CONTROL_SIZE"), value : featureUnit.valueOf("bControlSize"), declaration: true, type : usbTypes.byte_t}
        };
        // Process the array of the bmaControls in the component - create a list of values.
        bmaControlsList = featureUnit.processArray("bmaControls", function (item) {
            var value = item.getValue();
            return value;
        });
        // Add all bmaControls into the descriptor strcture
        // bmaControls - the type can by byte or word, depend on the settings bControlSize
        bmaControlsType = (featureUnitStruct.bControlSize.value == 1) ? usbTypes.byte_t : usbTypes.word_t;
		for (var i = 0; i < bmaControlsList.length; i++) {
		    featureUnitStruct["bmaControls" + i] = {id : ("USB_" + interface_ID + "_CONTROL_FEATURE_UNIT_" + unit_ID + "_CHANNEL" + i + "_CONTROLS"), value : bmaControlsList[i].join(" | "), declaration: true, type : bmaControlsType};
		}
		// the last item of the feature unit descriptor - string description
		featureUnitStruct["iFeature"] = {id : "USB_NO_STRING_DESCRIPTION", value : 0x0, declaration: false, type : usbTypes.byte_t};
        return featureUnitStruct;
    }


    /**
     * This function returns definition of an item in descritptor based on the type
     * @param {item} object of the item {id : <value>, value : <value>, declaration: <value>, type : <value>}
     * @returns {string} descriptor definition as array
     */
    self.getItemDefinition = function(item) {
        switch (item.type) {
            case usbTypes.byte_t:
                return [item.id];
                break;
            case usbTypes.word_t:
                return [(CONST.USB_GET_LOW_BYTE_MACRO + "(" + item.id + "),\n"), (CONST.USB_GET_HIGH_BYTE_MACRO + "(" + item.id + ")")];
                break;
            default:
                scriptApi.logError("Unsupported USB type of the audio interface descriptor item: " + item.type);
                return "";
                break;
        }
    }

    /**
     * This function returns define of an item in descritptor based on the type
     * @param {item} object of the item {id : <value>, value : <value>, declaration: <value>, type : <value>}
     * @returns {string} descriptor definition as array
     */
    self.getItemDefine = function(item) {
        var define_str = "";
        if (item.value[0] == "(" ) {
            define_str = "#define " + item.id + " " + item.value;
        } else {
            define_str = "#define " + item.id + " (" + item.value + "U)";
        }
        return define_str;
    }


    /**
     * This function return the formated descriptor definition of all units stored in the audioControlInterface item of this object
     *
     * @param {indentStr} string used for indentation of the descriptor
     * @returns {string} formated output of the structure initialization code
     */
    self.getAudioControlDescriptor = function(indentStr) {
        var definition = "";

        // The header definition
        Object.keys(audioControlInterfaceHeader).forEach(function(key,index) {
            // key: the name of the object key
            // index: the ordinal position of the key within the object
            if (definition == "") {
                definition = indentStr + self.getItemDefinition(audioControlInterfaceHeader[key]).join(indentStr);
            } else {
                definition += ",\n" + indentStr + self.getItemDefinition(audioControlInterfaceHeader[key]).join(indentStr);
            }
        });
        // The audio control class specific descriptors
        for (var interface_index in audioControlInterface) {
            Object.keys(audioControlInterface[interface_index]).forEach(function(key,index) {
                // key: the name of the object key
                // index: the ordinal position of the key within the object
                if (definition == "") {
                    definition = indentStr + self.getItemDefinition(audioControlInterface[interface_index][key]).join(indentStr);
                } else {
                    definition += ",\n" + indentStr + self.getItemDefinition(audioControlInterface[interface_index][key]).join(indentStr);
                }
            });
        }
        return definition + ",";
    }

    /**
     * This function return the formated definition (summary) of all audio control units lengths
     *
     * @returns {string} formated summary (expression) of the descriptors' length
     */
    self.getAudioControlDescriptorLength = function() {
        // the header length
        var definition = audioControlInterfaceHeader.bLength.id;

        // The audio control class specific descriptors - terminals and units
        for (var interface_index in audioControlInterface) {
            definition += " + " + audioControlInterface[interface_index].bLength.id;
        }
        return definition;
    }

    /**
     * This function return the formated audio entity (initialization  of the structure) of all units stored in the audioControlInterface item of this object
     *
     * @param {indentStr} string used for indentation of the descriptor
     * @param {interface_ID} id of the current interface for definition of identifiers
     * @returns {string} formated output of the descriptor
     */
    self.getAudioControlEntityDefinition = function(indentStr, interface_ID) {
        var definition = indentStr + "usb_device_audio_entity_struct_t g_UsbDevice" + interface_ID + "AudioEntity[]= {";
        var indentStr2 = indentStr + defaultIndent;
        var indentStr3 = indentStr2 + defaultIndent;

        // The audio control entity definition for each audio unit
        for (var interface_index in audioControlInterface) {
            // Processing of an unit - creating a initialization of one usb_device_audio_entity_struct_t structure
            definition += "\n" + indentStr2 + "{";
            Object.keys(audioControlInterface[interface_index]).forEach(function(key,index) {
                // key: the name of the object key
                // index: the ordinal position of the key within the object
                if (key === "bDescriptorSubtype") {
                    definition += "\n" + indentStr3 + ".entityType = " + audioControlInterface[interface_index][key].id + ",";
                } else if ((key === "bUnitID") || (key === "bTerminalID")) {
                    definition += "\n" + indentStr3 + ".entityId = " + audioControlInterface[interface_index][key].id + ",";
                }
            });
            // The terminalType is not used in the audio driver - it shall be always set to zero
            definition += "\n" + indentStr3 + ".terminalType = 0U";
            definition += "\n" + indentStr2 + "},";
        }
        definition += "\n" + indentStr + "};";
        // Definition of the entities for the interface - it is used as the classSpecific pointer in the usb_device_interface_struct_t
        definition += "\n" + indentStr + "usb_device_audio_entities_struct_t g_UsbDevice" + interface_ID + "AudioEntities = {";
        definition += "\n" + indentStr2 + ".entity = g_UsbDevice" + interface_ID + "AudioEntity,"
        definition += "\n" + indentStr2 + ".count = sizeof(g_UsbDevice" + interface_ID + "AudioEntity) / sizeof(usb_device_audio_entity_struct_t),"
        definition += "\n" + indentStr + "};";
        return definition;
    }

    /**
     * This function return the audio entities Id (for the classSpecific item of the usb_device_interface_struct_t)
     *
     * @param {interface_ID} id of the current interface for definition of identifiers
     * @returns {string} ID of the audio entities structure
     */
    self.getAudioControlEntityId = function(interface_ID) {
        return "g_UsbDevice" + interface_ID + "AudioEntities";
    }

    /**
     * This function return the formated (macro) definition of all used constants of the audio control descriptor
     *
     * @param {indentStr} string used for indentation of the definitions
     * @returns {string} formated output of the descriptor
     */
    self.getAudioControlDefinitions = function(indentStr) {
        var definition = "";
        // The header definition
        Object.keys(audioControlInterfaceHeader).forEach(function(key,index) {
            // key: the name of the object key
            // index: the ordinal position of the key within the object
            if (audioControlInterfaceHeader[key].declaration) {
                if (definition == "") {
                    definition = indentStr + self.getItemDefine(audioControlInterfaceHeader[key]);
                } else {
                    definition += "\n" + indentStr + self.getItemDefine(audioControlInterfaceHeader[key]);
                }
            }
        });
        // The audio control class specific descriptors
        for (var interface_index in audioControlInterface) {
            Object.keys(audioControlInterface[interface_index]).forEach(function(key,index) {
                // key: the name of the object key
                // index: the ordinal position of the key within the object
                if (audioControlInterface[interface_index][key].declaration) {
                    if (definition == "") {
                        definition = indentStr + self.getItemDefine(audioControlInterface[interface_index][key]);
                    } else {
                        definition += "\n" + indentStr + self.getItemDefine(audioControlInterface[interface_index][key]);
                    }
                }
            });
        }
        return definition;
    }

    /**
     * This function process all audio units to define the audio control descriptor. The internal structure audioControlInterface is used to store all data.
     *
     * @param {interface_ID} string ID of the audio control interface
     * @returns {void}
     */
    self.createUnitStructures = function(interface_ID) {
        // Output structure that contains all audio unit for processing in the template engine (configuration descriptor)
        var output_struct = [];
		if (audioUnits !== null) {
			audioUnits.getChildren().forEach(
				function (item) {
				    var unit_setting = new SettingsProvider(item);
					var unit_type = unit_setting.valueOf("audio_unit");
					switch (unit_type) {
					   case "kInputTerminal":
					       output_struct.push(self.processInputTerminal(unit_setting.getSetting("input_terminal"), interface_ID));
					       break;
					   case "kOutputTerminal":
					       output_struct.push(self.processOutputTerminal(unit_setting.getSetting("output_terminal"), interface_ID));
					       break;
					   case "kFeatureUnit":
					       output_struct.push(self.processFeatureUnit(unit_setting.getSetting("feature_unit"), interface_ID));
					       break;
                        default:
                            break;

					}
				}
			);

		} else {
			scriptApi.logError("Audio units array is empty : " + arraySettingId);
		}
		audioControlInterface = output_struct;
		return;
    }

};

/**
 * Function used for for processing of audio units in the compoennt. This object is created based on information read from USB component.
 *
 * @param {settingProvider} instance of audio units array in the interface
 * @returns {Object} descriptor
 */
function Audio20UnitConfig(settingProvider) {
    var self = this;
    var audioUnits = settingProvider.getSetting("units_audio_2_0");
    var ACHeaderDescriptor = new SettingsProvider(settingProvider.getSetting("acHeader_descriptor_audio_2_0"));
    var audioControlInterface = [];
    var audioControlInterfaceHeader = null;
    /* USB types that are used for defined items of descriptors */
    var usbTypes = { byte_t : 1, word_t : 2, dword_t : 4};

    /**
     * Function for creating of audio control class specfic header descriptor.
     * It stores the header into the audioControlInterfaceHeader variable of the AudioUnitConfig.
     *
     * @param {interface_ID} id of the current interface for definition of identifiers
     */
    self.createAudioControlInterfaceHeader = function(interface_ID) {
		// Create the total length of all class specific interfaces expression
		var interfaces_length_expr = "(USB_" + interface_ID + "_CONTROL_INTERFACE_HEADER_LENGTH";
		for (var i = 0; i < audioControlInterface.length; i++) {
		    interfaces_length_expr += " + " + audioControlInterface[i].bLength.id;
		}
		interfaces_length_expr += ")";

        audioControlInterfaceHeader = {
            bLength : {id : ("USB_" + interface_ID + "_CONTROL_INTERFACE_HEADER_LENGTH"), value : 0x09, declaration: true, type : usbTypes.byte_t},
            bDescriptorType : {id : "USB_DESCRIPTOR_TYPE_AUDIO_CS_INTERFACE" , value : 0x24, declaration: false, type : usbTypes.byte_t},
            bDescriptorSubtype : {id : "USB_DESCRIPTOR_SUBTYPE_AUDIO_CONTROL_HEADER", value : 0x01, declaration: false, type : usbTypes.byte_t},
            bcdADC : {id : ("USB_" + interface_ID + "_AUDIO_DEVICE_CLASS_SPECIFICATION_VERSION"), value : 0x0200, declaration: true, type : usbTypes.word_t},
            bCategory : {id : ("USB_" + interface_ID + "_CONTROL_INTERFACE_CATEGORY"), value : ACHeaderDescriptor.enumItemValueOf("bCategory"), declaration : true, type : usbTypes.byte_t},
            wTotalLength : {id : ("USB_" + interface_ID + "_CONTROL_INTERFACE_TOTAL_LENGTH"), value : interfaces_length_expr, declaration: true, type : usbTypes.word_t},
            bmControls : {id : ("USB_" + interface_ID + "_CONTROL_INTERFACE_LATENCY"), value : ACHeaderDescriptor.enumItemValueOf("bmControls"), declaration: true, type : usbTypes.byte_t}
        };
        return;
    };

    /** Retrieves item value for current item of the set or null (the item is not enabled)
	 *
	 * @returns {value} value of the setting
	 */
    self.getEnumItemValue = function(settingSp) {
        var setValue = settingSp.getValue();
        if (setValue) {
            return settingSp.getItemValue(); // return ID of the set item
        } else {
            return null;
        }
    };

    /**
     * Function for processing of input terminal unit. It returns the filled structure of input terminal for further processing.
     *
     * @param {inputTerminalSetting} parent node of the input terminal
     * @param {interface_ID} id of the current interface for definition of identifiers
     * @returns {object} input terminal structure
     */
    self.processInputTerminal = function(inputTerminalSetting, interface_ID) {
        var inputTerminal = new SettingsProvider(inputTerminalSetting);

        var terminal_ID = inputTerminal.valueOf("bTerminalID");
        var inputTerminalStruct = {
            bLength : {id : ("USB_" + interface_ID + "_CONTROL_INPUT_TERMINAL_" + terminal_ID + "_LENGTH"), value : 0x11, declaration: true, type : usbTypes.byte_t},
            bDescriptorType : {id : "USB_DESCRIPTOR_TYPE_AUDIO_CS_INTERFACE" , value : 0x24, declaration: false, type : usbTypes.byte_t},
            bDescriptorSubtype : {id : "USB_DESCRIPTOR_SUBTYPE_AUDIO_CONTROL_INPUT_TERMINAL", value : 0x02, declaration: false, type : usbTypes.byte_t},
            bTerminalID : {id : ("USB_" + interface_ID + "_CONTROL_INPUT_TERMINAL_" + terminal_ID + "_ID"), value : inputTerminal.valueOf("bTerminalID"), declaration: true, type : usbTypes.byte_t},
            wTerminalType : {id : ("USB_" + interface_ID + "_CONTROL_INPUT_TERMINAL_" + terminal_ID + "_TYPE"), value : inputTerminal.enumItemValueOf("wTerminalType"), declaration: true, type : usbTypes.word_t},
            bAssocTerminal : {id : "USB_INTERFACE_AUDIO_CONTROL_INPUT_TERMINAL_NO_ASSOCIATION", value : 0x0, declaration: false, type : usbTypes.byte_t},
            bCSourceID : {id : "USB_" + interface_ID + "_CONTROL_INPUT_TERMINAL_" + terminal_ID + "_CLOCK_SOURCE_ID", value : inputTerminal.enumItemValueOf("bCSourceID"), declaration: true, type : usbTypes.byte_t},
            bNrChannels : {id : ("USB_" + interface_ID + "_CONTROL_INPUT_TERMINAL_" + terminal_ID + "_CHANNELS_NUMBER"), value : inputTerminal.valueOf("bNrChannels"), declaration: true, type : usbTypes.byte_t},
            bmChannelConfig : {id : ("USB_" + interface_ID + "_CONTROL_INPUT_TERMINAL_" + terminal_ID + "_CHANNELS_CONFIG"), value : inputTerminal.valueOf("bmChannelConfig").join(" | "), declaration: true, type : usbTypes.dword_t},
            iChannelNames : {id : "USB_NO_STRING_DESCRIPTION", value : 0x0, declaration: false, type : usbTypes.byte_t},
            bmControls : {id : "USB_" + interface_ID + "_CONTROL_INPUT_TERMINAL_" + terminal_ID + "_CONTROLS", value : inputTerminal.valueOf("bmControls"), declaration: true, type : usbTypes.word_t},
            iTerminal : {id : "USB_NO_STRING_DESCRIPTION", value : 0x0, declaration: false, type : usbTypes.byte_t}
        };
        return inputTerminalStruct;
    };

    /**
     * Function for processing of output terminal unit. It returns the filled structure of output terminal for further processing.
     *
     * @param {outputTerminalSetting} parent node of the output terminal
     * @param {interface_ID} id of the current interface for definition of identifiers
     * @returns {object} output terminal structure
     */
    self.processOutputTerminal = function(outputTerminalSetting, interface_ID) {
        var outputTerminal = new SettingsProvider(outputTerminalSetting);

        terminal_ID = outputTerminal.valueOf("bTerminalID");
        var outputTerminalStruct = {
            bLength : {id : ("USB_" + interface_ID + "_CONTROL_OUTPUT_TERMINAL_" + terminal_ID + "_LENGTH"), value : 0x0C, declaration: true, type : usbTypes.byte_t},
            bDescriptorType : {id : "USB_DESCRIPTOR_TYPE_AUDIO_CS_INTERFACE" , value : 0x24, declaration: false, type : usbTypes.byte_t},
            bDescriptorSubtype : {id : "USB_DESCRIPTOR_SUBTYPE_AUDIO_CONTROL_OUTPUT_TERMINAL", value : 0x03, declaration: false, type : usbTypes.byte_t},
            bTerminalID : {id : ("USB_" + interface_ID + "_CONTROL_OUTPUT_TERMINAL_" + terminal_ID + "_ID"), value : outputTerminal.valueOf("bTerminalID"), declaration: true, type : usbTypes.byte_t},
            wTerminalType : {id : ("USB_" + interface_ID + "_CONTROL_OUTPUT_TERMINAL_" + terminal_ID + "_TYPE"), value : outputTerminal.enumItemValueOf("wTerminalType"), declaration: true, type : usbTypes.word_t},
            bAssocTerminal : {id : "USB_INTERFACE_AUDIO_CONTROL_OUTPUT_TERMINAL_NO_ASSOCIATION", value : 0x0, declaration: false, type : usbTypes.byte_t},
            bSourceID : {id : ("USB_" + interface_ID + "_CONTROL_OUTPUT_TERMINAL_" + terminal_ID + "_SOURCE_ID"), value : outputTerminal.enumItemValueOf("bSourceID"), declaration: true, type : usbTypes.byte_t},
            bCSourceID : {id : ("USB_" + interface_ID + "_CONTROL_OUTPUT_TERMINAL_" + terminal_ID + "_CLOCK_SOURCE_ID"), value : outputTerminal.enumItemValueOf("bCSourceID"), declaration: true, type : usbTypes.byte_t},
            bmControls : {id : "USB_" + interface_ID + "_CONTROL_OUTPUT_TERMINAL_" + terminal_ID + "_CONTROLS", value : outputTerminal.valueOf("bmControls"), declaration: true, type : usbTypes.word_t},
            iTerminal : {id : "USB_NO_STRING_DESCRIPTION", value : 0x0, declaration: false, type : usbTypes.byte_t}
        };
        return outputTerminalStruct;
    };

    /**
     * Function for processing of feature unit. It returns the filled structure of feature for further processing.
     *
     * @param {featureUnitSetting} parent node of the feature
     * @param {interface_ID} id of the current interface for definition of identifiers
     * @returns {object} feature structure
     */
    self.processFeatureUnit = function(featureUnitSetting, interface_ID) {
        var featureUnit = new SettingsProvider(featureUnitSetting);

        var bmaControlsList = [];
        var unit_ID = featureUnit.valueOf("bUnitID");
        var featureUnitStruct = {
            bLength : {id : ("USB_" + interface_ID + "_CONTROL_FEATURE_UNIT_" + unit_ID + "_LENGTH"), value : featureUnit.valueOf("bLength"), declaration: true, type : usbTypes.byte_t},
            bDescriptorType : {id : "USB_DESCRIPTOR_TYPE_AUDIO_CS_INTERFACE" , value : 0x24, declaration: false, type : usbTypes.byte_t},
            bDescriptorSubtype : {id : "USB_DESCRIPTOR_SUBTYPE_AUDIO_CONTROL_FEATURE_UNIT", value : 0x06, declaration: false, type : usbTypes.byte_t},
            bUnitID : {id : ("USB_" + interface_ID + "_CONTROL_FEATURE_UNIT_" + unit_ID + "_ID"), value : featureUnit.valueOf("bUnitID"), declaration: true, type : usbTypes.byte_t},
            bSourceID : {id : ("USB_" + interface_ID + "_CONTROL_FEATURE_UNIT_" + unit_ID + "_SOURCE_ID"), value : featureUnit.enumItemValueOf("bSourceID"), declaration: true, type : usbTypes.byte_t},
        };
        // Process the array of the bmaControls in the component - create a list of values.
        bmaControlsList = featureUnit.processArray("bmaControls", function (item) {
            return item;
        });

        // Add all bmaControls into the descriptor strcture
		for (var i = 0; i < bmaControlsList.length; i++) {
		    featureUnitStruct["bmaControls" + i] = {id : ("USB_" + interface_ID + "_CONTROL_FEATURE_UNIT_" + unit_ID + "_CHANNEL" + i + "_CONTROLS"), value : bmaControlsList[i].valueOf("bmaControls"), declaration: true, type : usbTypes.dword_t};
		}
		// the last item of the feature unit descriptor - string description
		featureUnitStruct["iFeature"] = {id : "USB_NO_STRING_DESCRIPTION", value : 0x0, declaration: false, type : usbTypes.byte_t};
        return featureUnitStruct;
    };

    /**
     * Function for processing of clock source unit. It returns the filled structure of clock source for further processing.
     *
     * @param {clockSourceSetting} parent node of the clock source
     * @param {interface_ID} id of the current interface for definition of identifiers
     * @returns {object} clock source structure
     */
    self.processClockSource = function(clockSourceSetting, interface_ID) {
        var clockSource = new SettingsProvider(clockSourceSetting);

        var clock_ID = clockSource.valueOf("bClockID");
        var clockSourceStruct = {
            bLength : {id : ("USB_" + interface_ID + "_CONTROL_CLOCK_SOURCE_UNIT_" + clock_ID + "_LENGTH"), value : 0x08, declaration: true, type : usbTypes.byte_t},
            bDescriptorType : {id : "USB_DESCRIPTOR_TYPE_AUDIO_CS_INTERFACE" , value : 0x24, declaration: false, type : usbTypes.byte_t},
            bDescriptorSubtype : {id : "USB_DESCRIPTOR_SUBTYPE_AUDIO_CONTROL_CLOCK_SOURCE_UNIT", value : 0x0A, declaration: false, type : usbTypes.byte_t},
            bClockID : {id : ("USB_" + interface_ID + "_CONTROL_CLOCK_SOURCE_UNIT_" + clock_ID + "_ID"), value : clockSource.valueOf("bClockID"), declaration: true, type : usbTypes.byte_t},
            bmAttributes : {id : ("USB_" + interface_ID + "_CONTROL_CLOCK_SOURCE_UNIT_" + clock_ID + "_ATTRIBUTES"), value : clockSource.valueOf("bmAttributes"), declaration: true, type : usbTypes.byte_t},
            bmControls : {id : "USB_" + interface_ID + "_CONTROL_CLOCK_SOURCE_UNIT_" + clock_ID + "_CONTROLS", value : clockSource.valueOf("bmControls"), declaration: true, type : usbTypes.byte_t},
            bAssocTerminal : {id : "USB_INTERFACE_AUDIO_CONTROL_CLOCK_SOURCE_UNIT_NO_ASSOCIATION", value : 0x0, declaration: false, type : usbTypes.byte_t},
            iClockSource : {id : "USB_NO_STRING_DESCRIPTION", value : 0x0, declaration: false, type : usbTypes.byte_t}
        };
        return clockSourceStruct;
    };

    /**
     * Function for processing of clock selector unit. It returns the filled structure of clock selector for further processing.
     *
     * @param {clockSelectorSetting} parent node of the clock selector
     * @param {interface_ID} id of the current interface for definition of identifiers
     * @returns {object} clock selector structure
     */
    self.processClockSelector = function(clockSelectorSetting, interface_ID) {
        var clockSelector = new SettingsProvider(clockSelectorSetting);
        var baCSourceIDList = [];
        var clock_ID = clockSelector.valueOf("bClockID");
        var clockSelectorStruct = {
            bLength : {id : ("USB_" + interface_ID + "_CONTROL_CLOCK_SELECTOR_UNIT_" + clock_ID + "_LENGTH"), value : clockSelector.valueOf("bLength"), declaration: true, type : usbTypes.byte_t},
            bDescriptorType : {id : "USB_DESCRIPTOR_TYPE_AUDIO_CS_INTERFACE" , value : 0x24, declaration: false, type : usbTypes.byte_t},
            bDescriptorSubtype : {id : "USB_DESCRIPTOR_SUBTYPE_AUDIO_CONTROL_CLOCK_SELECTOR_UNIT", value : 0x0B, declaration: false, type : usbTypes.byte_t},
            bClockID : {id : ("USB_" + interface_ID + "_CONTROL_CLOCK_SELECTOR_UNIT_" + clock_ID + "_ID"), value : clockSelector.valueOf("bClockID"), declaration: true, type : usbTypes.byte_t},
            bNrInPins : {id : ("USB_" + interface_ID + "_CONTROL_CLOCK_SELECTOR_UNIT_" + clock_ID + "_INPUT_NUMBERS"), value : clockSelector.valueOf("bNrInPins"), declaration: true, type : usbTypes.byte_t}
        };
        // Process the array of the bmaControls in the component - create a list of values.
        baCSourceIDList = clockSelector.processArray("baCSourceID", function (item) {
            var value = item.getValue();
            return value;
        });
        // Add all baCSourceID into the descriptor strcture
		for (var i = 0; i < baCSourceIDList.length; i++) {
		    clockSelectorStruct["baCSourceID" + i] = {id : ("USB_" + interface_ID + "_CONTROL_CLOCK_SELECTOR_UNIT_" + clock_ID + "_CLOCK_SOURCE_" + i), value : baCSourceIDList[i], declaration: true, type : usbTypes.byte_t};
		}
        clockSelectorStruct["bmControls"] = {id : "USB_" + interface_ID + "_CONTROL_CLOCK_SELECTOR_UNIT_" + clock_ID + "_CONTROLS", value : clockSelector.enumItemValueOf("bmControls"), declaration: true, type : usbTypes.byte_t},
		// The last item of the clock selector unit descriptor - string description
		clockSelectorStruct["iClockSelector"] = {id : "USB_NO_STRING_DESCRIPTION", value : 0x0, declaration: false, type : usbTypes.byte_t};
        return clockSelectorStruct;
    };

    /**
     * Function for processing of clock multiplier unit. It returns the filled structure of clock multiplier for further processing.
     *
     * @param {clockMultiplierSetting} parent node of the clock multiplier
     * @param {interface_ID} id of the current interface for definition of identifiers
     * @returns {object} clock multiplier structure
     */
    self.processClockMultiplier = function(clockMultiplierSetting, interface_ID) {
        var clockMultiplier = new SettingsProvider(clockMultiplierSetting);

        var clock_ID = clockMultiplier.valueOf("bClockID");
        var clockMultiplierStruct = {
            bLength : {id : ("USB_" + interface_ID + "_CONTROL_CLOCK_MULTIPLIER_UNIT_" + clock_ID + "_LENGTH"), value : 0x07, declaration: true, type : usbTypes.byte_t},
            bDescriptorType : {id : "USB_DESCRIPTOR_TYPE_AUDIO_CS_INTERFACE" , value : 0x24, declaration: false, type : usbTypes.byte_t},
            bDescriptorSubtype : {id : "USB_DESCRIPTOR_SUBTYPE_AUDIO_CONTROL_CLOCK_MULTIPLIER_UNIT", value : 0x24, declaration: false, type : usbTypes.byte_t},
            bClockID : {id : ("USB_" + interface_ID + "_CONTROL_CLOCK_MULTIPLIER_UNIT_" + clock_ID + "_ID"), value : clockMultiplier.valueOf("bClockID"), declaration: true, type : usbTypes.byte_t},
            bCSourceID : {id : ("USB_" + interface_ID + "_CONTROL_CLOCK_MULTIPLIER_UNIT_" + clock_ID + "_CLOCK_SOURCE_ID"), value : clockMultiplier.enumItemValueOf("bCSourceID"), declaration: true, type : usbTypes.byte_t},
            bmControls : {id : "USB_" + interface_ID + "_CONTROL_CLOCK_MULTIPLIER_UNIT_" + clock_ID + "_CONTROLS", value : clockMultiplier.valueOf("bmControls"), declaration: true, type : usbTypes.byte_t},
            iClockMultiplier : {id : "USB_NO_STRING_DESCRIPTION", value : 0x0, declaration: false, type : usbTypes.byte_t}
        };
        return clockMultiplierStruct;
    };


    /**
     * This function returns definition of an item in descritptor based on the type
     * @param {item} object of the item {id : <value>, value : <value>, declaration: <value>, type : <value>}
     * @returns {string} descriptor definition as array
     */
    self.getItemDefinition = function(item) {
        switch (item.type) {
            case usbTypes.byte_t:
                return [item.id];
                break;
            case usbTypes.word_t:
                return [(CONST.USB_GET_LOW_BYTE_MACRO + "(" + item.id + "),\n"), (CONST.USB_GET_HIGH_BYTE_MACRO + "(" + item.id + ")")];
                break;
            case usbTypes.dword_t:
                return [(CONST.USB_GET_LOW_BYTE_MACRO  + "(((uint32_t)" + item.id + ") & 0xFFFFU),\n"),
                        (CONST.USB_GET_HIGH_BYTE_MACRO + "(((uint32_t)" + item.id + ") & 0xFFFFU),\n"),
                        (CONST.USB_GET_LOW_BYTE_MACRO  + "((((uint32_t)" + item.id + ") >> 16U ) & 0xFFFFU),\n"),
                        (CONST.USB_GET_HIGH_BYTE_MACRO + "((((uint32_t)" + item.id + ") >> 16U ) & 0xFFFFU)")];
                break;
            default:
                scriptApi.logError("Unsupported USB type of the audio interface descriptor item: " + item.type);
                return "";
                break;
        }
    };

    /**
     * This function returns define of an item in descritptor based on the type
     * @param {item} object of the item {id : <value>, value : <value>, declaration: <value>, type : <value>}
     * @returns {string} descriptor definition as array
     */
    self.getItemDefine = function(item) {
        var define_str = "";
        if (item.value[0] == "(" ) {
            define_str = "#define " + item.id + " " + item.value;
        } else {
            define_str = "#define " + item.id + " (" + item.value + "U)";
        }
        return define_str;
    };


    /**
     * This function return the formated descriptor definition of all units stored in the audioControlInterface item of this object
     *
     * @param {indentStr} string used for indentation of the descriptor
     * @returns {string} formated output of the structure initialization code
     */
    self.getAudioControlDescriptor = function(indentStr) {
        var definition = "";

        // The header definition
        Object.keys(audioControlInterfaceHeader).forEach(function(key,index) {
            // key: the name of the object key
            // index: the ordinal position of the key within the object
            if (definition == "") {
                definition = indentStr + self.getItemDefinition(audioControlInterfaceHeader[key]).join(indentStr);
            } else {
                definition += ",\n" + indentStr + self.getItemDefinition(audioControlInterfaceHeader[key]).join(indentStr);
            }
        });
        // The audio control class specific descriptors
        for (var interface_index in audioControlInterface) {
            Object.keys(audioControlInterface[interface_index]).forEach(function(key,index) {
                // key: the name of the object key
                // index: the ordinal position of the key within the object
                if (definition == "") {
                    definition = indentStr + self.getItemDefinition(audioControlInterface[interface_index][key]).join(indentStr);
                } else {
                    definition += ",\n" + indentStr + self.getItemDefinition(audioControlInterface[interface_index][key]).join(indentStr);
                }
            });
        }
        return definition + ",";
    };

    /**
     * This function return the formated definition (summary) of all audio control units lengths
     *
     * @returns {string} formated summary (expression) of the descriptors' length
     */
    self.getAudioControlDescriptorLength = function() {
        return audioControlInterfaceHeader.wTotalLength.value;
    };

    /**
     * This function return the formated audio entity (initialization  of the structure) of all units stored in the audioControlInterface item of this object
     *
     * @param {indentStr} string used for indentation of the descriptor
     * @param {interface_ID} id of the current interface for definition of identifiers
     * @returns {string} formated output of the descriptor
     */
    self.getAudioControlEntityDefinition = function(indentStr, interface_ID) {
        var definition = indentStr + "usb_device_audio_entity_struct_t g_UsbDevice" + interface_ID + "AudioEntity[]= {";
        var indentStr2 = indentStr + defaultIndent;
        var indentStr3 = indentStr2 + defaultIndent;

        // The audio control entity definition for each audio unit
        for (var interface_index in audioControlInterface) {
            // Processing of an unit - creating a initialization of one usb_device_audio_entity_struct_t structure
            definition += "\n" + indentStr2 + "{";
            Object.keys(audioControlInterface[interface_index]).forEach(function(key,index) {
                // key: the name of the object key
                // index: the ordinal position of the key within the object
                if (key === "bDescriptorSubtype") {
                    definition += "\n" + indentStr3 + ".entityType = " + audioControlInterface[interface_index][key].id + ",";
                } else if ((key === "bUnitID") || (key === "bTerminalID") || (key === "bClockID")) {
                    definition += "\n" + indentStr3 + ".entityId = " + audioControlInterface[interface_index][key].id + ",";
                }
            });
            // The terminalType is not used in the audio driver - it shall be always set to zero
            definition += "\n" + indentStr3 + ".terminalType = 0U";
            definition += "\n" + indentStr2 + "},";
        }
        definition += "\n" + indentStr + "};";
        // Definition of the entities for the interface - it is used as the classSpecific pointer in the usb_device_interface_struct_t
        definition += "\n" + indentStr + "usb_device_audio_entities_struct_t g_UsbDevice" + interface_ID + "AudioEntities = {";
        definition += "\n" + indentStr2 + ".entity = g_UsbDevice" + interface_ID + "AudioEntity,"
        definition += "\n" + indentStr2 + ".count = sizeof(g_UsbDevice" + interface_ID + "AudioEntity) / sizeof(usb_device_audio_entity_struct_t),"
        definition += "\n" + indentStr + "};";
        return definition;
    };

    /**
     * This function return the audio entities Id (for the classSpecific item of the usb_device_interface_struct_t)
     *
     * @param {interface_ID} id of the current interface for definition of identifiers
     * @returns {string} ID of the audio entities structure
     */
    self.getAudioControlEntityId = function(interface_ID) {
        return "g_UsbDevice" + interface_ID + "AudioEntities";
    };


    /**
     * This function return the formated (macro) definition of all used constants of the audio control descriptor
     *
     * @param {indentStr} string used for indentation of the definitions
     * @returns {string} formated output of the descriptor
     */
    self.getAudioControlDefinitions = function(indentStr) {
       var definition = "";
         // The header definition
        Object.keys(audioControlInterfaceHeader).forEach(function(key,index) {
            // key: the name of the object key
            // index: the ordinal position of the key within the object
            if (audioControlInterfaceHeader[key].declaration) {
                if (definition == "") {
                    definition = indentStr + self.getItemDefine(audioControlInterfaceHeader[key]);
                } else {
                    definition += "\n" + indentStr + self.getItemDefine(audioControlInterfaceHeader[key]);
                }
            }
        });
        // The audio control class specific descriptors
        for (var interface_index in audioControlInterface) {
            Object.keys(audioControlInterface[interface_index]).forEach(function(key,index) {
                // key: the name of the object key
                // index: the ordinal position of the key within the object
                if (audioControlInterface[interface_index][key].declaration) {
                    if (definition == "") {
                        definition = indentStr + self.getItemDefine(audioControlInterface[interface_index][key]);
                    } else {
                        definition += "\n" + indentStr + self.getItemDefine(audioControlInterface[interface_index][key]);
                    }
                }
            });
        }
        return definition;
    };

    /**
     * This function process all audio units to define the audio control descriptor. The internal structure audioControlInterface is used to store all data.
     *
     * @param {interface_ID} string ID of the audio control interface
     * @returns {void}
     */
    self.createUnitStructures = function(interface_ID) {
        // Output structure that contains all audio unit for processing in the template engine (configuration descriptor)
        var output_struct = [];
		if (audioUnits !== null) {
			audioUnits.getChildren().forEach(
				function (item) {
				    var unit_setting = new SettingsProvider(item);
					var unit_type = unit_setting.valueOf("audio_unit");
					switch (unit_type) {
					   case "kInputTerminal":
					       output_struct.push(self.processInputTerminal(unit_setting.getSetting("input_terminal"), interface_ID));
					       break;
					   case "kOutputTerminal":
					       output_struct.push(self.processOutputTerminal(unit_setting.getSetting("output_terminal"), interface_ID));
					       break;
					   case "kFeatureUnit":
					       output_struct.push(self.processFeatureUnit(unit_setting.getSetting("feature_unit"), interface_ID));
					       break;
                       case "kClockSource":
					       output_struct.push(self.processClockSource(unit_setting.getSetting("clock_source"), interface_ID));
					       break;
                       case "kClockSelector":
					       output_struct.push(self.processClockSelector(unit_setting.getSetting("clock_selector"), interface_ID));
					       break;
                       case "kClockMultiplier":
					       output_struct.push(self.processClockMultiplier(unit_setting.getSetting("clock_multiplier"), interface_ID));
					       break;
                        default:
                            break;

					}
				}
			);

		} else {
			scriptApi.logError("Audio units array is empty : " + arraySettingId);
		}
		audioControlInterface = output_struct;
		return;
    };
};

/**
 * Function used for creating a descriptor object. This object is created based on information read from USB component.
 *
 * @param {ComponentInstance} componentInstance
 * @returns {Object} descriptor
 */
function DescriptorCreator(componentInstance) {
	// settings provider for instance
	var instanceSp = new SettingsProvider(componentInstance);
	var modeId = componentInstance.getMode().getId();

	/**
	 * Creates a string from provided words with specified case.
	 *
	 * @param {String|array of Strings} words
	 * @param {String} requestedCase in CamelCase
	 * @returns {String} string with requested case
	 */
	function composeString(words, requestedCase) {
		var output = "";

		if (!(words.constructor === Array)) {
			words = [words];
		}

		switch (requestedCase) {
			case "UpperCase":
				output = words.join("").toUpperCase();
				break;
			case "LowerCase":
				output = words.join("").toLowerCase();
				break;
			case "CamelCase":
				words.forEach(function (word) {
					word = "" + word;
					output += word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
				});
				break;
			case "LowerCamelCase":
				output = composeString(words, "CamelCase");
				output = output.charAt(0).toLowerCase() + output.slice(1);
				break;
			case "LowerSnakeCase":
				output = words.join("_").toLowerCase();
				break;
			case "SnakeCase":
				output = words.join("_").toUpperCase();
				break;
		}

		return output;
	}

	/**
	 * Counts interfaces where isochronous endpoints are allowed
	 *
	 * @param {array of Objects} interfaces
	 */
	function countPotentiallyIsochronousInterfaces(interfaces) {
		var count = 0;
		interfaces.forEach(function(interface) {
			switch (interface.interfaceClass) {
				case CONST.USB_CLASS_HID:
					break;
				default:
					++count;
					break;
			}
		});
		return count;
	}

	/**
	 * Callback function to create an interface descriptor object
	 *
	 * @param {SettingProvider} interfaceSp
	 * @returns {Object} interface descriptor
	 */
	function usbInterfaceHandler(interfaceSp) {

		/**
		 * Translates Audio protocol name to the corresponding integer code
		 *
		 * @param {String} audioProtocolName string equivalent of the Audio protocol
		 * @returns {Number} integer code of the Audio protocol
		 */
		function audioProtocolCode(audioProtocolName) {
			switch (audioProtocolName) {
				case "none":
					return CONST.AUDIO_PROTOCOL_NONE;
                case "ipv20":
					return CONST.AUDIO_PROTOCOL_IPV20;
				default:
					scriptApi.logError("Unknown Audio protocol: " + audioProtocolName);
					return -1;
			}
		}

		/**
		 * Translates CIC protocol name to the corresponding integer code
		 *
		 * @param {String} cicProtocolName string equivalent of the CIC protocol
		 * @returns {Number} integer code of the CIC protocol
		 */
		function cicProtocolCode(cicProtocolName) {
			switch (cicProtocolName) {
				case "none":
					return CONST.CIC_PROTOCOL_NONE;
				default:
					scriptApi.logError("Unknown CIC protocol: " + cicProtocolName);
					return -1;
			}
		}

		/**
		 * Translates DIC protocol name to the corresponding integer code
		 *
		 * @param {String} dicProtocolName string equivalent of the DIC protocol
		 * @returns {Number} integer code of the DIC protocol
		 */
		function dicProtocolCode(dicProtocolName) {
			switch (dicProtocolName) {
				case "none":
					return CONST.DIC_PROTOCOL_NONE;
				default:
					scriptApi.logError("Unknown DIC protocol: " + dicProtocolName);
					return -1;
			}
		}

		/**
		 * Translates HID protocol name to the corresponding integer code
		 *
		 * @param {String} hidProtocolName string equivalent of the HID protocol
		 * @returns {Number} integer code of the HID protocol
		 */
		function hidProtocolCode(hidProtocolName) {
			switch (hidProtocolName) {
				case "keyboard":
					return CONST.HID_PROTOCOL_KEYBOARD;
				case "mouse":
					return CONST.HID_PROTOCOL_MOUSE;
				case "none":
					return CONST.HID_PROTOCOL_NONE;
				default:
					scriptApi.logError("Unknown HID protocol: " + hidProtocolName);
					return -1;
			}
		}

		/**
		 * Translates MSC protocol name to the corresponding integer code
		 *
		 * @param {String} mscProtocolName string equivalent of the MSC protocol
		 * @returns {Number} integer code of the MSC protocol
		 */
		function mscProtocolCode(mscProtocolName) {
			switch (mscProtocolName) {
				case "bbb":
					return CONST.MSC_PROTOCOL_BBB;
				default:
					scriptApi.logError("Unknown MSC protocol: " + mscProtocolName);
					return -1;
			}
		}

		/**
		 * Translates Printer protocol name to the corresponding integer code
		 *
		 * @param {String} printerProtocolName string equivalent of the Printer protocol
		 * @returns {Number} integer code of the Printer protocol
		 */
		function printerProtocolCode(printerProtocolName) {
			switch (printerProtocolName) {
				case "bidirectional":
					return CONST.PRINTER_PROTOCOL_BIDIRECTIONAL;
				default:
					scriptApi.logError("Unknown Printer protocol: " + printerProtocolName);
					return -1;
			}
		}

		/**
		 * Translates CIC subclass name to the corresponding integer code
		 *
		 * @param {String} cicSubClassName string equivalent of the CIC subclass
		 * @returns {Number} integer code of the CIC subclass
		 */
		function cicSubClassCode(cicSubClassName) {
			switch (cicSubClassName) {
				case "acm":
					return CONST.CIC_SUBCLASS_ACM;
				default:
					scriptApi.logError("Unknown CIC subclass: " + cicSubClassName);
					return -1;
			}
		}

		/**
		 * Translates Audio subclass name to the corresponding integer code
		 *
		 * @param {String} audioSubClassName string equivalent of the Audio subclass
		 * @returns {Number} integer code of the Audio subclass
		 */
		function audioSubClassCode(audioSubClassName) {
			switch (audioSubClassName) {
                case "none":
                    return CONST.AUDIO_SUBCLASS_NONE;
				case "audiocontrol":
					return CONST.AUDIO_SUBCLASS_AUDIOCONTROL;
				case "audiostream":
					return CONST.AUDIO_SUBCLASS_AUDIOSTREAM;
				default:
					scriptApi.logError("Unknown Audio subclass: " + audioSubClassName);
					return -1;
			}
		}

		/**
		 * Translates DIC subclass name to the corresponding integer code
		 *
		 * @param {String} dicSubClassName string equivalent of the DIC subclass
		 * @returns {Number} integer code of the DIC subclass
		 */
		function dicSubClassCode(dicSubClassName) {
			switch (dicSubClassName) {
				case "none":
					return CONST.DIC_SUBCLASS_NONE;
				default:
					scriptApi.logError("Unknown DIC subclass: " + dicSubClassName);
					return -1;
			}
		}

		/**
		 * Translates HID subclass name to the corresponding integer code
		 *
		 * @param {String} hidSubClassName string equivalent of the HID subclass
		 * @returns {Number} integer code of the HID subclass
		 */
		function hidSubClassCode(hidSubClassName) {
			switch (hidSubClassName) {
				case "bootinterface":
					return CONST.HID_SUBLCASS_BOOT_INTERFACE;
				case "none":
					return CONST.HID_SUBCLASS_NOSUBCLASS;
				default:
					scriptApi.logError("Unknown HID subclass: " + hidSubClassName);
					return -1;
			}
		}

		/**
		 * Translates MSC subclass name to the corresponding integer code
		 *
		 * @param {String} mscSubClassName string equivalent of the MSC subclass
		 * @returns {Number} integer code of the MSC subclass
		 */
		function mscSubClassCode(mscSubClassName) {
			switch (mscSubClassName) {
				case "scsi":
					return CONST.MSC_SUBCLASS_SCSI;
				default:
					scriptApi.logError("Unknown MSC subclass: " + mscSubClassName);
					return -1;
			}
		}

		/**
		 * Translates Printer subclass name to the corresponding integer code
		 *
		 * @param {String} printerSubClassName string equivalent of the Printer subclass
		 * @returns {Number} integer code of the Printer subclass
		 */
		function printerSubClassCode(printerSubClassName) {
			switch (printerSubClassName) {
				case "printers":
					return CONST.PRINTER_SUBCLASS_PRINTERS;
				default:
					scriptApi.logError("Unknown Printer subclass: " + printerSubClassName);
					return -1;
			}
		}

		/**
		 * Translates application specific subclass name to the corresponding integer code
		 *
		 * @param {String} applicationSpecificSubClassName string equivalent of the application specific subclass
		 * @returns {Number} integer code of the application specific subclass
		 */
		function appSpecificSubClassCode(applicationSpecificSubClassName) {
			switch (applicationSpecificSubClassName) {
				case "dfu":
					return CONST.APP_SPEC_SUBCLASS_DFU ;
				default:
					scriptApi.logError("Unknown Application specific subclass: " + applicationSpecificSubClassName);
					return -1;
			}
		}

        /**
		 * Translates application specific protocol name to the corresponding integer code
		 *
		 * @param {String} applicationSpecificSubClassName string equivalent of the application specific protocol
		 * @returns {Number} integer code of the application specific protocol
		 */
		function appSpecificProtocolCode(applicationSpecificProtocolName) {
			switch (applicationSpecificProtocolName) {
				case "appidle":
					return CONST.APP_SPEC_PROTOCOL_DFU_APP;
                    break;
                case "dfuidle":
                    return CONST.APP_SPEC_PROTOCOL_DFU_DFU;
                    break
				default:
					scriptApi.logError("Unknown Application specific protocol: " + applicationSpecificProtocolName);
					return -1;
			}
		}

		/**
		 * Function to process class specific parameters
		 *
		 * @param {String} classStr lower case USB interface class name
		 * @returns {Object} processed data
		 */
		function prepareData(classStr) {
			var classNr;
			var subClass = readSubClass(classSp);
			var protocol = readProtocol(classSp);
			var idSuffix = classSp.valueOf("interface_name");
			var deviceClass;

			switch (classStr) {
				case "audio_1_0":
                    // intentional fall-through
                case "audio_2_0":
                case "audiohost":
					deviceClass = "audio";
					classNr = CONST.USB_CLASS_AUDIO;
					subClass = audioSubClassCode(subClass);
					protocol = audioProtocolCode(protocol);
					break;
				case "cic":
					deviceClass = "cdc";
					classNr = CONST.USB_CLASS_CIC;
					subClass = cicSubClassCode(subClass);
					protocol = cicProtocolCode(protocol);
					break;
				case "dic":
					deviceClass = "cdc";
					classNr = CONST.USB_CLASS_DIC;
					subClass = dicSubClassCode(subClass);
					protocol = dicProtocolCode(protocol);
					break;
				case "hid":
					deviceClass = classStr;
					classNr = CONST.USB_CLASS_HID;
					subClass = hidSubClassCode(subClass);
					protocol = hidProtocolCode(protocol);
					break;
				case "msc":
					deviceClass = classStr;
					classNr = CONST.USB_CLASS_MSC;
					subClass = mscSubClassCode(subClass);
					protocol = mscProtocolCode(protocol);
					break;
				case "phdc":
					deviceClass = classStr;
					classNr = CONST.USB_CLASS_PHDC;
					// PHDC implements no subclasses and protocols
					subClass = CONST.PHDC_SUBCLASS_NONE;
					protocol = CONST.PHDC_PROTOCOL_NONE;
					break;
				case "printer":
					deviceClass = classStr;
					classNr = CONST.USB_CLASS_PRINTER;
					subClass = printerSubClassCode(subClass);
					protocol = printerProtocolCode(protocol);
					break;
                case "dfu":
					deviceClass = classStr;
					classNr = CONST.USB_CLASS_APPLICATION_SPECIFIC;
					subClass = appSpecificSubClassCode(subClass);
					protocol = appSpecificProtocolCode(protocol);
					break;
                default:
                    scriptApi.logError("Unknown device class: " + classStr);
                    break;
			}
			return {deviceClass: deviceClass, classNr: classNr, idSuffix: idSuffix, subClass: subClass, protocol: protocol};
		}

		/**
		 * Reads and processes report descriptor of HID class
		 *
		 * @param {SettingProvider} settingSp setting provider
		 * @returns {Object} Object containing report descriptor data and actual report length
		 */
		function processHidReportDescriptor(settingSp) {
            /* Items codes that represent the bTag and bType of each item. The bSize is computed and added in the code below. */ 
			var itemEnum = {kCollection: 0xA0, kDesignator_Index: 0x38, kDesignator_Maximum: 0x58, kDesignator_Minimum: 0x48, kEnd_Collection: 0xC0, kFeature: 0xB0,
				kInput: 0x80, kLogical_Maximum: 0x24, kLogical_Minimum: 0x14, kOutput: 0x90, kPhysical_Maximum: 0x44, kPhysical_Minimum: 0x34,
				kPop: 0xB4, kPush: 0xA4, kReport_Count: 0x94, kReport_Id: 0x84, kReport_Size: 0x74, kSet_Delimiter: 0xA8, kString_Index: 0x78,
				kString_Maximum: 0x98, kString_Minimum: 0x88, kUnit: 0x64, kUnit_Exponent: 0x54, kUsage: 0x08, kUsage_Maximum: 0x28,
				kUsage_Minimum: 0x18, kUsage_Page: 0x04};
			var data = [];
			var size = 0;
			var count = 0;
			var inputReportLengthBits = 0;
			var outputReportLengthBits = 0;
			var featureReportLengthBits = 0;

			function isByteAligned(valueBits){
				return	valueBits % CONST.SIZE_BYTE;
			}
            
            function numToHexStr(nr) {
                return "0x" + ("0" + nr.toString(16).toUpperCase()).substr(-2) + "U";
            };
            
			var items = settingSp.getSetting("report_descriptor").getChildren();

			items.forEach(function (item) {
				var itemSp = new SettingsProvider(item);
				var type = itemSp.valueOf("type");
				var value = itemSp.valueOf("value");
                var dataValue = itemSp.valueOf("value"); /* data value for generating the output (minus value is transfered to positive data value) */
				var bSize = itemSp.valueOf("bSize");
				var sizeInBytes = itemSp.valueOf("sizeInBits") / CONST.SIZE_BYTE;
				var valueStr = "";
				var remarkStr = itemSp.valueOf("remarks");
                
				switch (type) {
					case "kReport_Size":
						size = value;
						break;
					case "kReport_Count":
						count = value;
						break;
					case "kInput":
						inputReportLengthBits += size * count;
						break;
					case "kOutput":
						outputReportLengthBits += size * count;
						break;
					case "kFeature":
						featureReportLengthBits += size * count;
						break;
				}
                
                /* format the bytes of data to corect order and transfer to hexadecimal format*/
                for (var i = 0; i < sizeInBytes; i++) {
                    valueStr += ", " + numToHexStr(dataValue & 0xFF);
                    dataValue = dataValue >> CONST.SIZE_BYTE;
                }
                /* format remarks */
                if (remarkStr != "") {
                    remarkStr = "  /* " + remarkStr + " */";
                }
                /* create the item initialization values from the itemEnum code (bTag + bType), bSize, data values and add remarks */
                data.push(numToHexStr(itemEnum[type] | bSize) + valueStr + "," + remarkStr);
			});

			if (isByteAligned(inputReportLengthBits)) {
			  // It is an error - the INPUT_REPORT_LENGTH value is not an integer value; the generated code cannot be compiled
				scriptApi.logError("HID input report of interface " + interface.index + " is not alligned to bytes");
			}
			if (isByteAligned(outputReportLengthBits)) {
			  // It is an error - the OUTPUT_REPORT_LENGTH value is not an integer value; the generated code cannot be compiled
				scriptApi.logError("HID output report of interface " + interface.index + " is not alligned to bytes");
			}
			if (isByteAligned(featureReportLengthBits)) {
			  // It is an error - the FEATURE_REPORT_LENGTH value is not an integer value; the generated code cannot be compiled
				scriptApi.logError("HID feature report of interface " + interface.index + " is not alligned to bytes");
			}

			// divide reportLength by 8 to get the size in bytes
			return {data: data, inputReportLength: inputReportLengthBits / CONST.SIZE_BYTE,outputReportLength: outputReportLengthBits / CONST.SIZE_BYTE,
				featureReportLength: featureReportLengthBits / CONST.SIZE_BYTE};
		}

		/**
		 * Initializes class-dependent parts of the interface descriptor and options
		 * @param {Object} settingProvider
		 * @param {Object} interface descriptor
		 * @param {Object} options
		 * @param {String} classStr
		 * @returns {undefined}
		 */
		function initClassDependentInterface(settingProvider, interface, options, classStr) {
			switch (classStr) {
				case "cic": {
					var counter = classSp.valueOf("data_interface_count");
					interface.dataInterfaceCount = counter;
					var children = settingProvider.getSetting("interfaces").getChildren();
					var out = [];
					for (var j = index + 1; (counter > 0) && (j < children.length); ++j) {
						var itemResult = usbInterfaceHandler(new SettingsProvider(children[j]));
						if (itemResult !== null) {
							out.push(itemResult);
						}
						--counter;
					}
					interface.dataInterfaces = out;
					break;
				}
				case "audio_1_0": {
					// The USB AUDIO requires the Interface Assocication Descriptor definition (bDeviceClass, bDeviceSubClass, bDeviceProtocol) in the device descriptor 
					var counter = 0;
					var children = settingProvider.getSetting("interfaces").getChildren();
					var out = [];
					for (var j = index + 1; j < children.length; ++j) {
                        var interfaceSP = new SettingsProvider(children[j])
                        if (interfaceSP.valueOf("interface_class") == "kClassAudio_1_0") {
                            if (interfaceSP.valueOf("setting_audio_1_0.subclass") == "kSubclassAudioStream") {
                                out.push(usbInterfaceHandler(interfaceSP));
							    counter++;
                            }
                        }
					}
					interface.dataInterfaces = out;
					interface.dataInterfaceCount = counter;
                    if (classSp.valueOf("subclass") == "kSubclassAudioControl") {
                        var audioUnits = new AudioUnitConfig(classSp.getSetting("audio_units"));
                        // create all audio units for current interface; interface.idSnakeCase is provide for creating of descriptor identifiers
    					audioUnits.createUnitStructures(interface.idSnakeCase);
       					interface.audioUnits = audioUnits;
    				}
					break;
				}
				case "audio_2_0": {
					// The USB AUDIO requires the Interface Assocication Descriptor definition (bDeviceClass, bDeviceSubClass, bDeviceProtocol) in the device descriptor 
					var counter = 0;
					var children = settingProvider.getSetting("interfaces").getChildren();
					var out = [];
					for (var j = index + 1; j < children.length; ++j) {
                        var interfaceSP = new SettingsProvider(children[j])
                        if (interfaceSP.valueOf("interface_class") == "kClassAudio_2_0") {
                            if (interfaceSP.valueOf("setting_audio_2_0.subclass") == "kSubclassAudioStream") {
                                out.push(usbInterfaceHandler(interfaceSP));
							    counter++;
                            }
                        }
					}
					interface.dataInterfaces = out;
					interface.dataInterfaceCount = counter;
                    if (classSp.valueOf("subclass") == "kSubclassAudioControl") {
    					var audioUnits = new Audio20UnitConfig(classSp);
                        // create all audio units for current interface; interface.idSnakeCase is provide for creating of descriptor identifiers
    					audioUnits.createUnitStructures(interface.idSnakeCase);
       					interface.audioUnits = audioUnits;
    				}
					break;
				}
			}
		}

		/**
		 * Initializes device class-dependent parts of the interface descriptor and options
		 * @param {Object} interface descriptor
		 * @param {String} classStr
		 * @returns {undefined}
		 */
		function initDeviceClassDependentInterface(interface, classStr) {
			switch (classStr) {
				case "hid": {
					var descriptor = processHidReportDescriptor(classSp);
					interface.reportDescriptor = descriptor.data;
					interface.inputReportLength = descriptor.inputReportLength;
					interface.outputReportLength = descriptor.outputReportLength;
					interface.featureReportLength = descriptor.featureReportLength;
					break;
				}
			}
		}

		/**
		 * Process single endpoints setting
		 *
		 * @param {SettingProvider} settingSp setting provider
		 * @returns {Object} Object containing information about endpoints setting
		 */
		function processEndpointsSetting(settingSp) {
			var setting = {};
			var idWords = ["setting", settingSp.getArrayItemIndex()];

			idWords = idWords.concat(settingSp.valueOf("setting_name").trim().split(/[_\s]/));
			setting["idSnakeCase"] = composeString(idWords, "SnakeCase");
			setting["idCamelCase"] = composeString(idWords, "CamelCase");
			/* Audio header and format setting */
			if (settingSp.isChildAvailable("header")) {
			    var headerSetting = new SettingsProvider(settingSp.getSetting("header"));
			    setting["audioStreamSpecificSettings"] = true;
			    setting["bTerminalLink"] = headerSetting.valueOf("bTerminalLink");
			    setting["bDelay"] = headerSetting.valueOf("bDelay");
			    setting["wFormatTag"] = headerSetting.enumItemValueOf("wFormatTag");
			    var formatSetting = new SettingsProvider(settingSp.getSetting("format"));
			    setting["bFormatDescriptorLength"] = 8; // the fix part of the descriptor only
			    setting["bFormatType"] = formatSetting.enumItemValueOf("bFormatType");
			    setting["bNrChannels"] = formatSetting.valueOf("bNrChannels");
			    setting["bSubframeSize"] = formatSetting.valueOf("bSubframeSize");
			    setting["bBitResolution"] = formatSetting.valueOf("bBitResolution");
			    setting["bSamFreqType"] = formatSetting.valueOf("bSamFreqType");
			    if (setting.bSamFreqType == 0) { // range definition
			        setting["tLowerSamFreq"] = formatSetting.valueOf("tLowerSamFreq");
			        setting["tUpperSamFreq"] = formatSetting.valueOf("tUpperSamFreq");
			        setting["bFormatDescriptorLength"] += 6;
			    } else { // list of frequencies
			        setting["tSamFreqList"] = formatSetting.processArray("tSamFreqList", function (listSp) {
			            var value = listSp.getValue();
			            return value;
			        });
			        setting["bFormatDescriptorLength"] += (setting.tSamFreqList.length * 3);
			    }
			    //setting[""] = formatSetting.valueOf("");
			} else {
			    setting["audioStreamSpecificSettings"] = false;
			}
            /* Audio 2.0 header and format setting */
            if (settingSp.isChildAvailable("asInterface_descriptor_audio_2_0")) {
                var headerSetting = new SettingsProvider(settingSp.getSetting("asInterface_descriptor_audio_2_0"));
                setting["audio20StreamSpecificSettings"] = true;
                setting["bTerminalLink"] = headerSetting.enumItemValueOf("bTerminalLink");
                setting["bmControls"] = headerSetting.valueOf("bmControls");
                setting["bFormatType"] = headerSetting.enumItemValueOf("bFormatType");
                setting["bmFormats"] = headerSetting.enumItemValueOf("bmFormats");
                setting["bNrChannels"] = headerSetting.valueOf("bNrChannels");
                setting["bmChannelConfig"] = headerSetting.valueOf("bmChannelConfig").join(" | ");
                var formatSetting = new SettingsProvider(settingSp.getSetting("typeIFormat_descriptor_audio_2_0"));
   			    setting["bSubslotSize"] = formatSetting.enumItemValueOf("bSubslotSize");
   			    setting["bBitResolution"] = formatSetting.valueOf("bBitResolution");

            } else {
                setting["audio20StreamSpecificSettings"] = false;
            }

			/* END of the audio header and format setting */
            setting["endpoints"] = settingSp.processArray("endpoints", function (endpointSp) {
                var endpoint = {
					typeSnakeCase: composeString(endpointSp.valueOf("transfer_type").slice(1), "SnakeCase"),
					directionSnakeCase: composeString(endpointSp.valueOf("direction").slice(1), "SnakeCase"),
					packetSizeFs: endpointSp.valueOf("max_packet_size_fs"),
					packetSizeHs: endpointSp.valueOf("max_packet_size_hs"),
					intervalFs: endpointSp.valueOf("polling_interval_fs"),
					intervalHs: endpointSp.valueOf("polling_interval_hs"),
					classType: endpointSp.valueOf("class_type"),
					refresh: endpointSp.valueOf("bRefresh"),
					synchAddress : endpointSp.valueOf("bSynchAddress"),
					synchronization : (endpointSp.enumItemValueOf("synchronization") == 0) ? "" : " | " + endpointSp.enumItemValueOf("synchronization"),
					usage : " | " + endpointSp.enumItemValueOf("usage"),
					endpointUsage : endpointSp.enumItemValueOf("usage"),
				};

				// replaced by the epIndex variable due to improvement of the UI - endpoint.index = endpointSp.getIndex();
				endpoint.index = endpointSp.valueOf("epIndex");
				endpoint.idSnakeCase = interface.idSnakeCase + "_" + composeString(["setting", settingSp.getArrayItemIndex(), "EP", endpoint.index, endpoint.typeSnakeCase, endpoint.directionSnakeCase], "SnakeCase");
                // Class specific audio stream data endpoint descriptor
                if (endpointSp.getSetting("cs_as_data").isAvailable()) {
                     endpoint["cs_as_data_available"] = true;
                     var cs_as_data = new SettingsProvider(endpointSp.getSetting("cs_as_data"));
                     endpoint["bmAttributes"] = cs_as_data.valueOf("bmAttributes");
                     endpoint["bLockDelayUnits"] = cs_as_data.enumItemValueOf("bLockDelayUnits");
                     endpoint["wLockDelay"] = cs_as_data.valueOf("wLockDelay");
                } else {
                     endpoint["cs_as_data_available"] = false;
                }
                // Class specific audio 2.0 stream data endpoint descriptor
                if (endpointSp.getSetting("cs_as_data_2_0").isAvailable()) {
                    endpoint["cs_as_data_2_0_available"] = true;
                    var cs_as_data_2_0 = new SettingsProvider(endpointSp.getSetting("cs_as_data_2_0"));
                    endpoint["bmAttributes"] = cs_as_data_2_0.valueOf("bmAttributes") ? 128 : 0;
                    endpoint["bmControls"] = cs_as_data_2_0.valueOf("bmControls");
                    endpoint["bLockDelayUnits"] = cs_as_data_2_0.enumItemValueOf("bLockDelayUnits");
                    endpoint["wLockDelay"] = cs_as_data_2_0.valueOf("wLockDelay");
                } else {
                    endpoint["cs_as_data_2_0_available"] = false;
                }
                return endpoint;
			});

			return setting;
		}
		var classStr = readClass(interfaceSp);
		var classIdStr = readClassId(interfaceSp);
		var classSp = new SettingsProvider(interfaceSp.getSetting("setting_" + classStr));
		var classSpecific = prepareData(classStr);
		var index = interfaceSp.getArrayItemIndex();

		var idWords = ["interface"];
		idWords.push(index);
		var suffixes = classSpecific.idSuffix.trim().split(/[_\s]/);
		for (var i = 0; i < suffixes.length; ++i) {
			if (!suffixes[i].isEmpty()) {
				idWords.push(suffixes[i]);
			}
		}
		options[classIdStr + "Count"]++;
		var interface = {
			idSnakeCase: composeString(idWords, "SnakeCase"),
			idCamelCase: composeString(idWords, "CamelCase"),
			idLowerCamelCase: composeString(idWords, "LowerCamelCase"),
			idLowerSnakeCase: composeString(idWords, "LowerSnakeCase"),
			classLowerCase: classStr,
			classCamelCase: composeString(classStr, "CamelCase"),
			deviceClassCamelCase: composeString(classSpecific.deviceClass, "CamelCase"),
			index: index,
			interfaceClass: classSpecific.classNr,
			interfaceSubClass: classSpecific.subClass,
			interfaceProtocol: classSpecific.protocol,
			implementation: classSp.valueOf("implementation"),
			/* Check when the template interface shall be generated in case the implmentation is selected as None. */
			generateTemplateInterface: (classSp.getChild("generateTemplateInterface") != null) ? classSp.valueOf("generateTemplateInterface") : true,
			inEndpointsCount : modeId == "device" ? classSp.valueOf("in_ep_count"): 0,
			outEndpointsCount : modeId == "device" ? classSp.valueOf("out_ep_count") : 0,
			dataInterfaceCount: 0,
			dataInterfaces: [],
			audioUnits: null
		};

		switch (modeId) {
			case "host":
				initClassDependentInterface(hostSp, interface, options, classStr);
				break;
			case "device":
				initClassDependentInterface(deviceSp, interface, options, classStr);
				initDeviceClassDependentInterface(interface, classStr);

				// If a class interface with data interface is used then the IAD (Interface Association Descriptor) for a USB function is specified.
				// When the IAD (USB_DESCRIPTOR_TYPE_INTERFACE_ASSOCIATION) is used in the configuration descriptor the IAD shall be specified in the device 
				// descriptor (options["deviceClass"] = 0xEF, options["deviceSubClass"] = 0x02, options["deviceProtocol"] = 0x01
				if (interface.dataInterfaceCount > 0) {
				  // Definition of the Interface Association Descriptor
					options["deviceClass"] = CONST.USB_CLASS_MISCELLANEOUS;
					options["deviceSubClass"] = CONST.USB_SUBCLASS_MISCELLANEOUS;
					options["deviceProtocol"] = CONST.USB_PROTOCOL_MISCELLANEOUS;
				}

				interface.endpointsSettings = classSp.processArray("endpoints_settings", processEndpointsSetting)
		}

        switch(classStr){
            case "dfu":
                interface.firmwareAddress = classSp.valueOf("firmware_address");
                interface.firmwareSize = classSp.valueOf("firmware_size");
                interface.dfuModePid = classSp.valueOf("dfu_mode_pid");
                break;
        }

		return interface;
	}

	var options = {
		deviceClass: 0x00,
		deviceSubClass: 0x00,
		deviceProtocol: 0x00,
		hidCount: 0,
		cicCount: 0,
		mscCount: 0,
		audioCount: 0,
		audio20Count: 0,
		phdcCount: 0,
		videoCount: 0,
		ccidCount: 0,
		printerCount: 0,
        dfuCount: 0
	};

	switch (modeId) {
		case "host": {
			var hostSp = new SettingsProvider(componentInstance.getChildById("hostSettings"));
			options.irqHandlerName = hostSp.valueOf("irq_handler");
			options.maxPower = hostSp.valueOf("max_power");
			options.hubSupported = hostSp.valueOf("hub_support") ? 1 : 0;
			options.interfaceCount = hostSp.getArrayLength("interfaces");
			options.interfaces = hostSp.processArray("interfaces", usbInterfaceHandler);
			options.highSpeedSupported = hostSp.valueOf("high_speed_supported");
			options.hasDevicePhdc = hostSp.valueOf("hasDevicePhdc");
			options.ieee11073TypesRequired = hostSp.valueOf("ieee11073TypesRequired");
			options.isIeee11073TypesRequiredInDevice = hostSp.valueOf("isIeee11073TypesRequiredInDevice");
			break;
		}
		case "device": {
			var deviceSp = new SettingsProvider(componentInstance.getChildById("deviceSetting"));
			options.irqHandlerName = deviceSp.valueOf("irq_handler");
			options.maxPower = deviceSp.valueOf("max_power");
			options.selfPowered = deviceSp.valueOf("self_powered") ? 1 : 0;
            options.suspendResume = deviceSp.valueOf("suspend_resume") ? true : false;
            options.remoteWakeup = deviceSp.valueOf("remote_wakeup") ? true : false;
			options.vendorIdUpper = (deviceSp.valueOf("vendor_id") >>> 8) & 0xFF;
			options.vendorIdLower = deviceSp.valueOf("vendor_id") & 0xFF;
			options.productIdUpper = (deviceSp.valueOf("product_id") >>> 8) & 0xFF;
			options.productIdLower = deviceSp.valueOf("product_id") & 0xFF;
			options.manufacturerString = deviceSp.valueOf("manufacturer_string");
			options.productString = deviceSp.valueOf("product_string");
			options.interfaceCount = deviceSp.getArrayLength("interfaces");
			options.interfaces = deviceSp.processArray("interfaces", usbInterfaceHandler);
			options.topEndpointNumber = deviceSp.valueOf("highest_endpoint_number");
			options.highSpeedSupported = deviceSp.valueOf("high_speed_supported");
			options.hasHostPhdc = deviceSp.valueOf("hasHostPhdc");
			options.ieee11073TypesRequired = deviceSp.valueOf("ieee11073TypesRequired");
			options.isIeee11073TypesRequiredInHost = deviceSp.valueOf("isIeee11073TypesRequiredInHost");

			// post-processing of interfaces - calculation of inter-dependencies
			// Add list of the audio-streaming interfaces into audio control interface
			var audio_stream_interface_list = [];
			for (var i = 0; i < options.interfaces.length; i++) {
                if (options.interfaces[i].interfaceSubClass == CONST.AUDIO_SUBCLASS_AUDIOSTREAM) {
                    audio_stream_interface_list.push(options.interfaces[i]);
                }
			}
            // Use the list of the audio control interface to create the header
			for (var i = 0; i < options.interfaces.length; i++) {
			    if  ((options.interfaces[i].interfaceClass == CONST.USB_CLASS_AUDIO) && (options.interfaces[i].interfaceSubClass == CONST.AUDIO_SUBCLASS_AUDIOCONTROL)) {
                    if (options.interfaces[i].interfaceProtocol == CONST.AUDIO_PROTOCOL_IPV20){
                        // Audio 2.0
                        options.interfaces[i].audioUnits.createAudioControlInterfaceHeader(options.interfaces[i].idSnakeCase);
                    }
                    else{
                        // Audio 1.0
                        options.interfaces[i].audioUnits.createAudioControlInterfaceHeader(audio_stream_interface_list, options.interfaces[i].idSnakeCase);
                    }
                }
			}
			break;
		}
	}

	options.potentiallyIsochronousInterfaceCount = countPotentiallyIsochronousInterfaces(options.interfaces);

	var info = scriptApi.getProfile().getMcuInfo();
	var specifics = getProcessorSpecifics(info.getPartNumber(), info.getSeries(), instanceSp.getPeripheral());
	for (var property in specifics) options[property] = specifics[property];

	options.controllerNameCamelCase = composeString(options.controllerName, "CamelCase");
	options.controllerNameUpperCase = composeString(options.controllerName, "UpperCase");

    return options;
};

/**
 * Determines whether the given interface class represents a single logical function
 * and employs several subordinate interfaces that should be associated.
 *
 * @param {type} interface object to check
 * @param {type} interfaces array of device interface objects
 * @returns {Boolean} {@code true} if associable, {@code false} otherwise
 *
 * @note Only contiguously numbered interfaces can be associated.
 */
function isAssociableInterface(interface, interfaces) {
	if (isSubordinateInterface(interface, interfaces)) {
		// not implemented for subordinate interfaces
		return false;
	}
	if (interface.dataInterfaceCount === 0) {
		return false;
	}
	var instances = interfaces.filter(function(instance) {
		return (!isSubordinateInterface(instance, interfaces))
			&& (instance.dataInterfaceCount > 0);
	});
	if (instances.length < 1) {
		return false;
	}
	return true;
}

/**
 * Checks whether the given interface class is a part of the device class represented by any other interface (even itself) in the specified array.
 *
 * @param {type} interface object to check
 * @param {type} interfaces array of device interface objects
 * @returns {Boolean} {@code true} if subordinate, {@code false} otherwise
 */
function isSubordinateInterface(interface, interfaces) {
	for (var i = 0; i < interfaces.length; ++i) {
		var subords = interfaces[i].dataInterfaces;
		for (var j = 0; j < subords.length; ++j) {
			if (interface.index === subords[j].index) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Returns the superior interface class of the given interface.
 *
 * @param {type} interface object
 * @param {type} interfaces array of device interface objects
 * @returns {object} superior interface object
  */
function getSuperiorInterface(interface, interfaces) {
	for (var i = 0; i < interfaces.length; ++i) {
		var subords = interfaces[i].dataInterfaces;
		for (var j = 0; j < subords.length; ++j) {
			if (interface.index === subords[j].index) {
				return interfaces[i];
			}
		}
	}
	return null;
}

/**
 * Function to generate USB application code.
 *
 * @param {ComponentInstance} componentInstance
 * @param {FunctionalGroup} functionalGroup
 * @returns {undefined}
 */
function USBgenerator(componentInstance, functionalGroup) {
	var coreId = functionalGroup.getCore();
	var tEngine = new TemplatingEngine();
	var modeId = componentInstance.getMode().getId();

	/**
	 * Function to generate file from template.
	 *
	 * @param {String} templateName template file name
	 * @param {String} fileName generated file name
	 * @param {String} folder in which the file will be generated
	 * @param {String} license at the top of the generated file
	 * @param {Object} options descriptor object
	 * @returns {undefined}
	 */
	function generateFile(templateName, fileName, folder, license, options) {
		var template = componentInstance.readComponentFile(templateName);
		if (fileName === "") {
			var fileName = templateName.replace(/(.*)_([ch(txt)])\.template/, "$1.$2");
		}
		new OutputFile(folder + fileName, coreId).close(license + tEngine.generate(template, options));
	};

	/**
	 * Function to generate User files.
	 *
	 * @param {object} interface for which user files are generated
	 * @param {string} path where should be files generated
	 * @returns {undefined}
	 */
	function generateDeviceUserFiles(interface, path) {
		var fileName = "usb_device_" + interface.idSnakeCase.toLowerCase();

		new OutputFile(path + fileName + ".c", coreId).closeNoWrite();

		switch(interface.interfaceClass) {
			case CONST.USB_CLASS_PRINTER:
				// Intentional fall through
			case CONST.USB_CLASS_CIC:
				new OutputFile(path + fileName + ".h", coreId).closeNoWrite();
				break;
			case CONST.USB_CLASS_PHDC:
				new OutputFile(path + fileName + ".h", coreId).closeNoWrite();
				new OutputFile(path + fileName + "_shim_agent.c", coreId).closeNoWrite();
				new OutputFile(path + fileName + "_shim_agent.h", coreId).closeNoWrite();
				break;
		}
	}

	/**
	 * Function to generate ieee11073 application files used by PHDC class.
	 *
	 * @param {string} mode
	 * @param {string} path path where files will be generated
	 * @param {string} license used in generated files
	 * @param {object} options descriptor object
	 * @param {boolean} generateImplementation or user files
	 */
	function generateIeee11073Files(modeId, path, license, options, generateImplementation) {
		// These files are shared by all PHDC interfaces.
		var files = [];

		if (modeId === "device") {
            files.push(["usb_device_phdc_ieee11073_agent", "h"]);
            files.push(["usb_device_phdc_ieee11073_agent", "c"]);
		} else if (modeId === "host") {
			files.push(["usb_host_phdc_ieee11073_nomenclature", "h"]);
			files.push(["usb_host_phdc_ieee11073_nomenclature", "c"]);
		}

		if (generateImplementation) {
			files.forEach(function (file){
				generateFile(file[0] + "_" + file[1] + ".template", "", path, license, options);
			});
		} else {
			files.forEach(function (file){
				new OutputFile(path + file[0] + "." + file[1], "", coreId).closeNoWrite();
			});
		}

		// Decide whether to generate implementation of ieee11073 types, empty file or nothing. This file is common for all PHDC interfaces of both device and host.
		var generateTypesImplementation = false;
		var generateTypesUserFile = false;

		if (modeId === "host") {
			generateTypesImplementation = (options.ieee11073TypesRequired && !options.hasDevicePhdc) || (options.ieee11073TypesRequired && !options.isIeee11073TypesRequiredInDevice)
			generateTypesUserFile = !options.hasDevicePhdc && !options.ieee11073TypesRequired;
		} else if (modeId === "device") {
			generateTypesImplementation = options.ieee11073TypesRequired;
			generateTypesUserFile = (!options.hasHostPhdc || !options.isIeee11073TypesRequiredInHost) && !options.ieee11073TypesRequired;
		}

		if (generateTypesImplementation && generateTypesUserFile) {
			scriptApi.logError("Implementation of ieee11073Types and user file requested at the same time.");
		}

		var typesH = "usb_phdc_ieee11073_types";
		if (generateTypesImplementation) {
			generateFile(typesH + "_h.template", "", path, license, options);
		} else if (generateTypesUserFile) {
			new OutputFile(callbackFolder + typesH + ".h", coreId).closeNoWrite();
		}
	}

	if (!componentInstance.getError()){
		var licenseTemplate = componentInstance.readComponentFile("license_txt.template");
		var generatedLicense = tEngine.generate(licenseTemplate, {});
		var generatedFolder = "/source/generated/";
		var callbackFolder = "/source/";
		var options = new DescriptorCreator(componentInstance);
		var ieee11073ImplementationRequired = false;

		switch (modeId) {
			case "host":
				generateFile("usb_host_common_h.template", "", generatedFolder, generatedLicense, options);
				generateFile("usb_host_config_h.template", "", generatedFolder, generatedLicense, options);
				generateFile("usb_host_app_c.template", "", generatedFolder, generatedLicense, options);
				generateFile("usb_host_app_h.template", "", generatedFolder, generatedLicense, options);

				options.interfaces.forEach(function (interface) {
					var fileNameC = "usb_host_" + interface.idSnakeCase.toLowerCase() + ".c";
					var fileNameH = "usb_host_" + interface.idSnakeCase.toLowerCase() + ".h";

					switch (interface.implementation) {
						case "kImplementationNone":
							if (interface.generateTemplateInterface) {
								// This case is used to mark implementation file as User file
								new OutputFile(callbackFolder + fileNameC, coreId).closeNoWrite();
								new OutputFile(callbackFolder + fileNameH, coreId).closeNoWrite();
							}
							break;
						case "kImplementationCicVcom":
							generateFile("usb_host_cic_vcom_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							generateFile("usb_host_cic_vcom_h.template", fileNameH, callbackFolder, generatedLicense, interface);
							break;
						case "kImplementationDicVcom":
							// nothing to do
							break;
						case "kImplementationKeyboard":
							generateFile("usb_host_hid_keyboard_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							generateFile("usb_host_hid_keyboard_h.template", fileNameH, callbackFolder, generatedLicense, interface);
							break;
						case "kImplementationGeneric":
							generateFile("usb_host_hid_generic_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							generateFile("usb_host_hid_generic_h.template", fileNameH, callbackFolder, generatedLicense, interface);
							break;
						case "kImplementationMouse":
							generateFile("usb_host_hid_mouse_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							generateFile("usb_host_hid_mouse_h.template", fileNameH, callbackFolder, generatedLicense, interface);
							break;
						case "kImplementationPlainTextPrinter":
							generateFile("usb_host_printer_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							generateFile("usb_host_printer_h.template", fileNameH, callbackFolder, generatedLicense, interface);
							break;
						case "kImplementationManager":
							ieee11073ImplementationRequired = true;
							generateFile("usb_host_phdc_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							generateFile("usb_host_phdc_h.template", fileNameH, callbackFolder, generatedLicense, interface);
							break;
                        case "kImplementationAudioSpeaker":
							generateFile("usb_host_audio_speaker_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							generateFile("usb_host_audio_speaker_h.template", fileNameH, callbackFolder, generatedLicense, interface);
							generateFile("usb_host_audio_speaker_data_c.template", "", callbackFolder, generatedLicense, interface);
							break;
						default:
							scriptApi.logError("Unknown USB class implementation: " + interface.implementation);
							break;
					}
				});
				break;
			case "device":
				generateFile("usb_device_composite_c.template", "", generatedFolder, generatedLicense, options);
				generateFile("usb_device_composite_h.template", "", generatedFolder, generatedLicense, options);
				generateFile("usb_device_config_h.template", "", generatedFolder, generatedLicense, options);
				generateFile("usb_device_descriptor_c.template", "", generatedFolder, generatedLicense, options);
				generateFile("usb_device_descriptor_h.template", "", generatedFolder, generatedLicense, options);
				var isTimerQueueNeeded = false;
				options.interfaces.forEach(function (interface) {
					var fileNameC = "usb_device_" + interface.idSnakeCase.toLowerCase() + ".c";
					var fileNameH = "usb_device_" + interface.idSnakeCase.toLowerCase() + ".h";

					switch (interface.implementation) {
						case "kImplementationNone":
							if (interface.generateTemplateInterface) {
								generateDeviceUserFiles(interface, callbackFolder);
							}
							break;
						case "kImplementationCicVcom":
							generateFile("usb_device_cic_vcom_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							generateFile("usb_device_cic_vcom_h.template", fileNameH, callbackFolder, generatedLicense, interface);
							break;
						case "kImplementationDicVcom":
							// nothing to do
							break;
						case "kImplementationGeneric":
							generateFile("usb_device_hid_generic_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							break;
						case "kImplementationKeyboard":
							generateFile("usb_device_hid_keyboard_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							break;
						case "kImplementationMouse":
							generateFile("usb_device_hid_mouse_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							break;
						case "kImplementationRamDisk":
							generateFile("usb_device_msc_ramdisk_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							break;
						case "kImplementationPlainTextPrinter":
							generateFile("usb_device_printer_h.template", fileNameH, callbackFolder, generatedLicense, interface);
							generateFile("usb_device_printer_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							break;
						case "kImplementationWeightScale":
							isTimerQueueNeeded = true;
							ieee11073ImplementationRequired = true;
							generateFile("usb_device_phdc_h.template", fileNameH, callbackFolder, generatedLicense, interface);
							generateFile("usb_device_phdc_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							generateFile("usb_device_phdc_shim_agent_h.template", "usb_device_" + interface.idSnakeCase.toLowerCase() + "_shim_agent.h", callbackFolder, generatedLicense, interface);
							generateFile("usb_device_phdc_shim_agent_c.template", "usb_device_" + interface.idSnakeCase.toLowerCase() + "_shim_agent.c", callbackFolder, generatedLicense, interface);
							break;
						case "kImplementationDfu":
							isTimerQueueNeeded = true;
							generateFile("usb_device_dfu_h.template", fileNameH, callbackFolder, generatedLicense, interface);
							generateFile("usb_device_dfu_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							generateFile("usb_device_dfu_app_h.template", "usb_device_" + interface.idSnakeCase.toLowerCase() + "_app.h", callbackFolder, generatedLicense, interface);
							generateFile("usb_device_dfu_app_c.template", "usb_device_" + interface.idSnakeCase.toLowerCase() + "_app.c", callbackFolder, generatedLicense, interface);
							generateFile("usb_flash_h.template", "usb_flash.h", generatedFolder, generatedLicense, options);
							generateFile("usb_dfu_ram_c.template", "usb_dfu_ram.c", generatedFolder, generatedLicense, options);
							break;
						case "kImplementationAudioSpeaker":
							generateFile("usb_device_audio_speaker_h.template", fileNameH, callbackFolder, generatedLicense, interface);
							generateFile("usb_device_audio_speaker_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							break;
                        case "kImplementationAudioGenerator":
							generateFile("usb_device_audio_generator_h.template", fileNameH, callbackFolder, generatedLicense, interface);
							generateFile("usb_device_audio_generator_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							generateFile("usb_device_audio_generator_data_c.template", "", callbackFolder, generatedLicense, interface);
							break;
                        case "kImplementationAudioUnified":
							generateFile("usb_device_audio_unified_h.template", fileNameH, callbackFolder, generatedLicense, interface);
							generateFile("usb_device_audio_unified_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							break;
						default:
							scriptApi.logError("Unknown USB class implementation: " + interface.implementation);
							break;
					}
				});
				if(options.remoteWakeup || isTimerQueueNeeded)
				{
					generateFile("timer_queue_h.template", "timer_queue.h", generatedFolder, generatedLicense, options);
					generateFile("timer_queue_c.template", "timer_queue.c", generatedFolder, generatedLicense, options);
				}
				break;
			default:
				scriptApi.logError("Unknown mode " + modeId);
				return;
		}

		if (options.phdcCount > 0) {
			generateIeee11073Files(modeId, callbackFolder, generatedLicense, options, ieee11073ImplementationRequired);
		}
	}
};

/**
 * Function provides content of sections for peripherals.c/h
 *
 * @param {ComponentInstance} componentInstance
 * @param {String} section
 * @returns {String} content of the section
 */
function sectionProvider(componentInstance, section) {
	var output = "default output value";
	var modeId = componentInstance.getMode().getId();
	switch (section) {
		case "includes":
			output =  modeId === "device" ? '#include "usb_device_composite.h"\r\n' : '#include "usb_host_app.h"\r\n';
			break;
		case "init_function_body":
			output =  modeId === "device" ? '  USB_DeviceApplicationInit();\r\n' : '  USB_HostApplicationInit();\r\n';
			break;
	}
	return output;
}

// register code generation function
CodeGenerator.registerInstanceCodeGenerator(USBgenerator);
CodeGenerator.registerSectionProvider(["includes", "init_function_body"], sectionProvider);
