/*
 * Copyright 2016 Freescale Semiconductor
 * Copyright 2016-2019 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */
scriptApi.requireScript(_currentScriptFolder + "usb_constants.js");
scriptApi.requireScript(_currentScriptFolder + "templatingengine.js");
scriptApi.requireScript(_currentScriptFolder + "usb_processor_specifics.js");

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
		return parent.getChildById(id);
	};

	/** Retrieves value for setting determined by ID
	 *
	 * @param {type} id in the form of configSetID.settingId.subSettingId
	 * @returns {undefined}
	 */
	self.valueOf = function (id) {
		var setting = self.getSetting(id);
		var value = null;
		if (setting !== null) {
			var type = setting.getTypeName();
			value = setting.getValue();
			// do value conversions if necessary
			switch (type) {
				case "integer":
					value = value.intValue();
					break;
				// items supported without conversion
				case "bool":
					// intentional fall through
				case "enum":
					// intentional fall through
				case "variable":
					// intentional fall through
				case "string":
					break;
				default:
					scriptApi.logWarning("Access to non-scalar value: " + id + " : " + setting.getTypeName());
					break;
			}
		} else {
			scriptApi.logError("Cannot find setting: " + id);
		}
		return value;
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
 * Function used for creating a descriptor object. This object is created based on information read from USB component.
 *
 * @param {ComponentInstance} componentInstance
 * @returns {Object} descriptor
 */
function DescriptorCreator(componentInstance) {
	// settings provider for instance
	var instanceSp = new SettingsProvider(componentInstance);
	var deviceSp = new SettingsProvider(componentInstance.getChildById("deviceSetting"));
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
			}
			return {deviceClass: deviceClass, classNr: classNr, idSuffix: idSuffix, subClass: subClass, protocol: protocol};
		}

		/**
		 * Reads and processed report descriptor of HID class
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
					options["deviceClass"] = CONST.USB_CLASS_CDC;
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

		var classStr = readClass(interfaceSp);
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

		options[classStr + "Count"]++;
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
			dataInterfaceCount: 0,
			dataInterfaces: []
		};

		switch (modeId) {
			case "host":
				initClassDependentInterface(hostSp, interface, options, classStr);
				break;
			case "device":
				initClassDependentInterface(deviceSp, interface, options, classStr);
				initDeviceClassDependentInterface(interface, classStr);
				if (interface.dataInterfaceCount > 0) {
					options["deviceClass"] = CONST.USB_CLASS_MISCELLANEOUS;
					options["deviceSubClass"] = CONST.USB_SUBCLASS_MISCELLANEOUS;
					options["deviceProtocol"] = CONST.USB_PROTOCOL_MISCELLANEOUS;
				}
				interface.endpoints = classSp.processArray("endpoints", function (endpointSp) {
					var endpoint = {
						typeSnakeCase: composeString(endpointSp.valueOf("transfer_type").slice(1), "SnakeCase"),
						directionSnakeCase: composeString(endpointSp.valueOf("direction").slice(1), "SnakeCase"),
						packetSizeFs: endpointSp.valueOf("max_packet_size_fs").slice(1),
						packetSizeHs: endpointSp.valueOf("max_packet_size_hs").slice(1),
						intervalFs: endpointSp.valueOf("polling_interval_fs"),
						intervalHs: endpointSp.valueOf("polling_interval_hs")
					};

					endpoint.index = endpointSp.getIndex();
					endpoint.idSnakeCase = interface.idSnakeCase + "_" + composeString(["EP", endpoint.index, endpoint.typeSnakeCase, endpoint.directionSnakeCase], "SnakeCase");
					return endpoint;
				});
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
		phdcCount: 0,
		videoCount: 0,
		ccidCount: 0,
		printerCount: 0
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
				files.push(["usb_device_phdc_ieee11073_timer", "h"]);
				files.push(["usb_device_phdc_ieee11073_timer", "c"]);
				files.push(["usb_device_phdc_ieee11073_agent", "h"]);
				files.push(["usb_device_phdc_ieee11073_agent", "c"]);
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
							// This case is used to mark implementation file as User file
							new OutputFile(callbackFolder + fileNameC, coreId).closeNoWrite();
							new OutputFile(callbackFolder + fileNameH, coreId).closeNoWrite();
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

				options.interfaces.forEach(function (interface) {
					var fileNameC = "usb_device_" + interface.idSnakeCase.toLowerCase() + ".c";
					var fileNameH = "usb_device_" + interface.idSnakeCase.toLowerCase() + ".h";
			
					switch (interface.implementation) {
						case "kImplementationNone":
							generateDeviceUserFiles(interface, callbackFolder);
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
							ieee11073ImplementationRequired = true;
							generateIeee11073Types = true;
							generateFile("usb_device_phdc_h.template", fileNameH, callbackFolder, generatedLicense, interface);
							generateFile("usb_device_phdc_c.template", fileNameC, callbackFolder, generatedLicense, interface);
							generateFile("usb_device_phdc_shim_agent_h.template", "usb_device_" + interface.idSnakeCase.toLowerCase() + "_shim_agent.h", callbackFolder, generatedLicense, interface);
							generateFile("usb_device_phdc_shim_agent_c.template", "usb_device_" + interface.idSnakeCase.toLowerCase() + "_shim_agent.c", callbackFolder, generatedLicense, interface);
							break;
						default:
							scriptApi.logError("Unknown USB class implementation: " + interface.implementation);
							break;
					}
				});
				
				if (options.phdcCount > 0) {
					generateIeee11073Files(modeId, callbackFolder, generatedLicense, options, ieee11073ImplementationRequired);
				}
				
				break;
			default:
				scriptApi.logError("Unknown mode " + modeId);
				return;
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
