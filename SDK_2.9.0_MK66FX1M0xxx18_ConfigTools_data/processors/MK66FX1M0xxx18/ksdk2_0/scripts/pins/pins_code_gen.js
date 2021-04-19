"use strict";

/*
 * Copyright 2016 Freescale Semiconductor
 * Copyright 2016-2018 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */

/* Script to generate code for Pins tool */

// "CMSIS" or "SDK"; SDK style can contain CMSIS access to registers
var codeStyle = "SDK";
//var codeStyle = "CMSIS";      

// "SDK" or "nonSDK"; It affects include (fsl_common.h, fsl_) generating
var projectType = "SDK";
//var projectType = "";

// Enables/Disables clock gate enable generation. It overrides the setting from the tool. This line is commented normally.
//var clockGateGeneration = true;     
//var clockGateGeneration = false; 

// Main part of generated files name
var chFileName = "pin_mux";

// Preprocessor condition is header file, typically #ifndef _PIN_MUX_H_ , "#define _PIN_MUX_H_"
var moduleName = "pin_mux";

// "true" comments line recurrent #define XYZ to avoid a redefinition (although there are effectively same values). It is set to false because none of supported compilers doesn't detect such situation as warning/error
var avoidDefineRedefinition = false;


// Default style for generating defines
var defaultDefineFormat = {
    // It determines the position of symbol on a line with #define, e.g. "PIN0_IDX" on "#define PIN0_IDX                         0u   /*!< Pin number for pin 0 in a port */" 
    defineNameColumn: 7,
    // It determines the position of last character of value on a line with #define, e.g. "0u" on "#define PIN0_IDX                         0u   /*!< Pin number for pin 0 in a port */" 
    defineValueEndColumn: 42,
    // It determines the position of comment on a line with #define, e.g. "/*!< Pin number for pin 0 in a port */" on "#define PIN0_IDX                         0u   /*!< Pin number for pin 0 in a port */" 
    defineCommentColumn: 45
}
// Style for generating direction defines in h file
var directionDefineFormat = {
    // It determines the position of symbol on a line with #define, e.g. "PIN0_IDX" on "#define PIN0_IDX                         0u   /*!< Pin number for pin 0 in a port */" 
    defineNameColumn: 7,
    // It determines the position of last character of value on a line with #define, e.g. "0u" on "#define PIN0_IDX                         0u   /*!< Pin number for pin 0 in a port */" 
    defineValueEndColumn: 79,
    // It determines the position of comment on a line with #define, e.g. "/*!< Pin number for pin 0 in a port */" on "#define PIN0_IDX                         0u   /*!< Pin number for pin 0 in a port */" 
    defineCommentColumn: 82
}
// It determines the position of comment on a line with c code, e.g. "/* PORTA0 (pin 50) is configured as PTA0 */" on "PORT_SetPinMux(PORTA, PIN0_IDX, kPORT_MuxAsGpio);          /* PORTA0 (pin 50) is configured as PTA0 */" 
var cCodeCommentColumn = 60;

// Defines number of characters accepted by clang-format on line. This parameter influences #define line comment. When clangColumnLimit=0 the comment format is unchanged.
var clangColumnLimit = 120;

// Mask of Pin Mux Control bit-field in Port Control Register. For both SDK and CMSIS code style generation.
var portMuxMask = 0x700;

// Mask of Pin Direction Control bit-field in Port Direction Register. For both SDK and CMSIS code style generation.
var gpioPddMask = 0x1;

// Following symbols are used for mapping to SDK functions, for SDK code style generation.
// Root peripheral name of XBAR peripheral
var xbarPeripheralName = "XBAR";
// Root register name of Crossbar Select Register
var xbarSelRegisterName = "SEL";
// Root register name of Crossbar Control Register
var xbarControlRegisterName = "CTRL";
// Root peripheral name of PORT peripheral
var portPeripheralName = "PORT";
// Root peripheral name of GPIO peripheral
var gpioPeripheralName = "GPIO";
// Root register name of Port Control Register
var portControlRegisterName = "PCR";
// Bit-field name of Pin Mux Control bit-field in Port Control Register
var pinMuxControlBitName = "MUX";
//Direction register name
var gpioDirectionRegisterName = "PDDR";
// Root register name of Digital Filter Enable Register
var digitalFilterEnableRegisterName = "DFER";
// Mask of Pin Mux Control bit-field in Port Control Register. For both SDK and CMSIS code style generation.
var pinMuxControlBitMask = 0x0700;
// Mask of pin interrupt bit-field in Port Control Register.
var pinIrqcBitMask= 0xF0000;
// Width of Pin Mux Control bit-field in Port Control Register.
var portMuxWidth = 3;
// Mask of ISF bit in Port Control Register. For both SDK and CMSIS code style generation.
var pinPortInterruptStatusFlagMask = 0x1000000;
// Root peripheral name of DMA peripheral
var dmaPeripheralName = "DMA";
// Root peripheral name of DMAMUX peripheral
var dmaMuxPeripheralName = "DMAMUX";
// Root register name of Dmamux Channel Config Register
var dmaMuxChannelConfigRegisterName = "CHCFG";
// Mask of SOURCE bit-field in CHCFG register.
var dmaMuxSourceBitMask = 0x3F;
// Offset of SOURCE bit-field in CHCFG register.
var dmaMuxSourceBitOffset = 0;
// Root peripheral name of TRGMUX peripheral
var trgmuxPeripheralName = "TRGMUX";
// Bit-field name of SEL bit-field in TRGMUX register
var trgmuxSelBitFieldName = "SEL";
// Register alias of TRGMUX registers
var trgmuxRegisterAlias = "TRGCFG[";

// First part of signal called signal function for GPIO signal (signal format is <signal function>, <signal channel>). It is used for generation of direction defines in h file.
var GPIOSignalFunction = "GPIO";

var gpioSignalConfiguration = {};

// Register database Object
var registerDatabaseObject = PExProcessor.getRegistersDB();
var dependencyHelper = scriptApi.getDependencyHelper();

var warning_message = "/***********************************************************************************************************************\n";
warning_message += " * This file was generated by the MCUXpresso Config Tools. Any manual edits made to this file\n";
warning_message += " * will be overwritten if the respective MCUXpresso Config Tools is used to update this file.\n";
warning_message += " **********************************************************************************************************************/\n";

// Regular expressions for matching "PORTx", "PTx" and pin number (YZ) from "PTxYZ" strings
var ptxRegex = /^PT[A-Z][0-9][0-9]?$/;
var portxRegex = /^PORT[A-Z][0-9][0-9]?$/;
var pinNoRegex = /[0-9]?[0-9]$/;
var commentRegex = /\/\*[^]*?\*\//g;
var commentDividersRegex = /[\s\n]+\*+\s+/g;

// Variable contains length of line with #define directive (to align all comments of defines related to one pin)
var defineLineLength = 0;

// Variable to store Pull electrical features (Pull enable/Pull disable, Pull up/Pull down) related do currently handled pin 
var pullStruct = new Object();

// Variable to store all routed pins with their attributes like corresponding component, identifier, port etc.
var routedPinsDB = new Array();

// Variable to store index of currently processed component
var currentComponent = -1;

// Object with key:value electrical feature constants where key is constant generated by pinsTool
// and value is the same constant from fsl_port.h driver
var driverConstants = {
    'PCR_SRE_SLOW': 'kPORT_SlowSlewRate',
    'PCR_SRE_FAST': 'kPORT_FastSlewRate',
    'PCR_ODE_ENABLED': 'kPORT_OpenDrainEnable',
    'PCR_ODE_DISABLED': 'kPORT_OpenDrainDisable',
    'PCR_PFE_ENABLED': 'kPORT_PassiveFilterEnable',
    'PCR_PFE_DISABLED': 'kPORT_PassiveFilterDisable',
    'PCR_DSE_HIGH': 'kPORT_HighDriveStrength',
    'PCR_DSE_LOW': 'kPORT_LowDriveStrength',

    'PCR_PS_UP': 'kPORT_PullUp',
    'PCR_PS_DOWN': 'kPORT_PullDown',
    'PCR_PE_ENABLED': 'kPORT_PullEnable',
    'PCR_PE_DISABLED': 'kPORT_PullDisable'

};


// Is it running in test mode. The test mode can be launched from tool with internal development support 
var testMode = true;
if (PExScript.getMacroSymbol('GENERATE_ALL_CONFIGURATIONS') == null) {
    testMode = false;
}

// Global array of messages
var messageList = new Array();

// Definitions of couple of comments, that delimites fragments of code ignored by clang-format tool
var clang_off = '/* clang-format off */';
var clang_on = '/* clang-format on */';

var generateExtendedHeader = scriptApi.getMexPreferences().isGenerateExtendedInformation();

function sortPrintFunctions(x, y) {
    return (x.printFunction.name == 'printPortSetPinInterruptConfig') ? 0 : -1;
}

/**
 * Function prints to file comment, that delimites fragments of code ignored by clang-format tool
 */
function clangOff() {
    PExOut_gen(clang_off);
}

/**
 * Function prints to file comment, that delimites fragments of code not supposed to be ignored by clang-format tool
 */
function clangOn() {
    PExOut_gen(clang_on);
}

/**
 * Function creates count long string consisting of characters. Example: makeString('*', 5) returns '*****'
 */
function makeString(character, count) {
    if (count > 0) {
        return (Array(count + 1).join(character[0]));
    } else {
        return "";
    }
}

/** 
 * Function gets block comment as an argument and splits the comment to multiple lines
 * with indentation not longer than 115 characters
 */
function formatComment(indentation, comment) {
    var formattedComment = makeString(' ', indentation);
    var lineLen = indentation;

    var commentLines = '';
    var words = comment.split(' ');

    for (var i = 0; i < words.length; i++) {
        if (words[i].length > 0) {
            if ((lineLen + 1 + words[i].length) > 115) {
                formattedComment += '\n' + makeString(' ', indentation) + ' * ';
                lineLen = indentation + 3;
            }
            formattedComment += words[i] + ' ';
            lineLen += words[i].length + 1;
        }
    }
    return formattedComment;
}

// Function prints opening doxygen comment @{ */ before #define directives related to one routed pin
function doxygenPinDefinesOpen() {
    PExOut_gen("  @{ */");
}

// Function prints indented closing doxygen comment /* @} */ after #define directives related to one routed pin
function doxygenPinDefinesClose() {
    PExOut_gen(((defineLineLength < 0) ? "" : (makeString(' ', defineLineLength))) + "/* @} */");
    defineLineLength = 0;
}

/**
 * Function splits sentence (argument) to multiple lines, which are not longer than 115 characters and start with ' * '
 */
function getBriefCommentLinesFromSentence(sentence) {
    var words = sentence.split(' ');
    var commentLines = '';
    var commentLine = ' *';
    for (var i = 0; i < words.length; i++) {
        if (words[i].length > 0) {
            if ((commentLine + " " + words[i]).length < 115) {
                commentLine += " " + words[i];
            } else {
                commentLines += commentLine + "\n";
                commentLine = ' *' + " " + words[i];
            }
        }
    }
    if (commentLine != ' *') {
        commentLines += commentLine + ".\n";
    }
    return commentLines;
}

function getCommentLinesFromSentence(sentence, indent) {
    var words = sentence.split(' ');
    var commentLines = [];
    var commentLine = '';
    if (sentence == "") {
        return "";
    }

    for (var i = 0; i < words.length; i++) {
        if (words[i].length > 0) {
            if (((commentLine + " " + words[i]).length + indent + 3) < 115) {
                commentLine += " " + words[i];
            } else {
                commentLines.push(commentLine);
                commentLine = words[i];
            }
        }
    }
    if (commentLine != '') {
        commentLines.push(commentLine + ".");
    }
    return commentLines;
}

/**
 * Function takes Doxygen @brief comment as an argument and normalizes it to max 120 characters in line.
 */
function normalizeBriefComment(comment) {
    var normalizedComment = comment;
    if (comment.length > 120) {
        normalizedComment = '/*!\n * @brief\n';
        var content = comment.split("/*!\n * @brief")[1].split("*/")[0];
        var sentences = content.split('.');
        for (var i = 0; i < sentences.length; i++) {
            normalizedComment += getBriefCommentLinesFromSentence(sentences[i]);
        }
        normalizedComment += ' */';
    }
    return normalizedComment;
}

/**
 * Function prints multiline string to output including newlines (PExOut_gen is not able to print newlines in stirng content)
 */
function PExOut_gen(stringToPrint) {
    var linesToPrint = stringToPrint.split(/\r*\n/g);
    for (var i = 0; i < linesToPrint.length; i++) {
        PExOut.gen(linesToPrint[i]);
    }
}

/**
 * Function finds, if item(1st param) is present in array arr(2nd param) 
 */
function inArray(item, arr) {
    for (var i in arr) {
        if (item == arr[i]) {
            return true;
        }
    }
    return false;
}

/**
 * Function finds, if subString (2nd param) is contained sourceString (1st param) 
 */
function Contains(sourceString, subString) {
    return ((sourceString.indexOf(subString)) != -1);
}

/**
 * Function finds, if subString (2nd param) is a suffix of sourceString (1st param) 
 */
function EndsWith(sourceString, subString) {
    if (!(Contains(sourceString, subString))) {
        return false;
    }
    return ((sourceString.indexOf(subString) + subString.length) == sourceString.length);
}

/**
 * Function finds, if subString (2nd param) is a prefix of sourceString (1st param) 
 */
function startsWith(sourceString, subString) {
    return (sourceString.indexOf(subString) == 0);
}

/**
 * Function calculates the maximal length of #define directive from directives generated from identifierDescriptor
 */
/**
 * Function calculates the maximal length of #define directive from directives generated from identifierDescriptor
 */
function getDefineLength(identifierDescriptor) {
    var maxLength = 0;
    var len = 0;

    var identifierBody = identifierDescriptor.prefix + identifierDescriptor.ipIdentifier;

    // Commented fragments of function should stay in code in order to keep generated code Clang formatted
    // when the defines will be needed in generated code 
    /*
      len = identifierBody.length + identifierDescriptor.signal.length + 18;
      if (len > maxLength) {
        maxLength = len;
      }
      identifierBody + "_SIGNAL",
      identifierDescriptor.signal,
      "Signal name",
      directionDefineFormat
      */

    if (generateExtendedHeader) {
        len = ("#define " + identifierBody + identifierDescriptor.identifier + "_PERIPHERAL " +  identifierDescriptor.peripheral).length + 1;
        if (len > maxLength) {
            maxLength = len;
        }

        len = ("#define " + identifierBody + identifierDescriptor.identifier + "_SIGNAL " +  identifierDescriptor.signal).length + 1;
        if (len > maxLength) {
            maxLength = len;
        }

        if ((identifierDescriptor.signal == GPIOSignalFunction) && (identifierDescriptor.channel != null) && (!(isNaN(parseInt(identifierDescriptor.channel))))) {
            len = ("#define " + identifierBody + identifierDescriptor.identifier + "_GPIO " +  identifierDescriptor.peripheral).length + 1;
            if (len > maxLength) {
                maxLength = len;
            }

            len = ("#define " + identifierBody + identifierDescriptor.identifier + "_GPIO_PIN " +  identifierDescriptor.channel + "U").length + 1;
            if (len > maxLength) {
                maxLength = len;
            }
        }

        /*
        if(identifierDescriptor.channel != null) {
          len = identifierBody.length + identifierDescriptor.channel.length + 18;
          identifierBody + "_CHANNEL",
          identifierDescriptor.channel,
          "Signal channel",
          directionDefineFormat
          */
        if (identifierDescriptor.channel != null) {
            len = len = ("#define " + identifierBody + identifierDescriptor.identifier + "_CHANNEL " +  identifierDescriptor.channel).length + 1;
            if (len > maxLength) {
                maxLength = len;
            }
        }

        /*
          len = identifierBody.length + identifierDescriptor.routeTo.length + 19;
          if (len > maxLength) {
            maxLength = len;
          }
          identifierBody + "_PIN_NAME",
          identifierDescriptor.routeTo,
          "Routed pin name",
          directionDefineFormat
        */
        len = ("#define " + identifierBody + identifierDescriptor.identifier + "_PIN_NAME " +  identifierDescriptor.routeTo).length + 1;
        if (len > maxLength) {
            maxLength = len;
        }


        var tmpLabel = "\"" + identifierDescriptor.label.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
        len = ("#define " + identifierBody + identifierDescriptor.identifier + "_LABEL " +  tmpLabel).length + 1;
        if (len > maxLength) {
            maxLength = len;
        }
        /*
          identifierBody + "_LABEL",
          "\"" + tmpLabel + "\"",
          "Label",
          directionDefineFormat
        */

        len = ("#define " + identifierBody + identifierDescriptor.identifier + "_NAME \"" +  identifierDescriptor.identifier + "\"").length + 1;
        if (len > maxLength) {
            maxLength = len;
        }
        /*
          identifierBody + "_" + identifierDescriptor.identifier + "_NAME",
          "\"" + identifierDescriptor.identifier + "\"",
          "Identifier",
          directionDefineFormat
        */

        var directionText = null;
        switch (identifierDescriptor.direction) {
            case "INPUT":
                directionText = "kPIN_MUX_DirectionInput";
                break;
            case "OUTPUT":
                directionText = "kPIN_MUX_DirectionOutput";
                break;
            case "INPUT/OUTPUT":
                directionText = "kPIN_MUX_DirectionInputOrOutput";
                break;
            default:
        };

        if (directionText != null) {
            len = ("#define " + identifierBody + identifierDescriptor.identifier + "_DIRECTION " +  directionText).length + 1;
            if (len > maxLength) {
                maxLength = len;
            }
            /* identifierBody + "_DIRECTION",
               directionText,
               "Direction",
               directionDefineFormat 
            */
        };
    }

    if (identifierDescriptor.port != null) {
        len = ("#define " + identifierBody + identifierDescriptor.identifier + "_PORT " +  identifierDescriptor.port[0]).length + 1;
        if (len > maxLength) {
            maxLength = len;
        }
        /*identifierBody + "_" + identifierDescriptor.identifier + "_PORT",
        identifierDescriptor.port[0],
        "PORT peripheral base pointer",
        directionDefineFormat*/

        len = len = ("#define " + identifierBody + identifierDescriptor.identifier + "_PIN " +  identifierDescriptor.pin + "U").length + 1;
        if (len > maxLength) {
            maxLength = len;
        }

        len = len = ("#define " + identifierBody + identifierDescriptor.identifier + "_PIN_MASK " + ("(1U << ") + identifierDescriptor.pin + "U)").length + 1;
        if (len > maxLength) {
            maxLength = len;
        } 

        len = len = ("#define " + identifierBody + identifierDescriptor.identifier + "_GPIO_PIN_MASK " + ("(1U << ") + identifierDescriptor.pin + "U)").length + 1;
        if (len > maxLength) {
            maxLength = len;
        }

        /*identifierBody + "_" + identifierDescriptor.identifier + "_PIN",
        identifierDescriptor.pin + "U",
        "PORT pin number",
        directionDefineFormat*/
    }

    if (maxLength >= 82) {
        return -1;
    }
    //return (identifierDescriptor.ipIdentifier == '' ? maxLength - 1 : maxLength);
    return maxLength;
}

/** 
 * Function finds, if key(1st param) is present in array arr(2nd param)
 */
function keyExists(key, arr) {
    var keys = Object.keys(arr);
    return (inArray(key, keys));
}

/** 
 * Function checks, if bitField value (bfVal) is present in driverConstants array, and if so, it will return corresponding value 
 * else returns bfVal unchanged
 */
function checkMask(bfVal) {
    if (keyExists(bfVal, driverConstants)) {
        return driverConstants[bfVal];
    }
    return bfVal;
}

/**
 * Function returns number of pin from port (example: getPinFromPort('PTA5') will return '5')
 */
function getPinFromPort(port) {
    var pin = (port.match(pinNoRegex));
    return (pin) ? pin[0] : port;
}

/**
 * Function returns number of pin from port (example: getPinFromPort('PTA5') will return 'PORTA')
 */
function getPortFromPortName(portName) {
    var port = portName.replace("PT", portPeripheralName);
    return port.substr(0, 5);
}

/**
 * Function returns two items long array of 'PORTx' and 'pinNumber' from pinName (example: ['PORTA','5'])
 */
function getPortFromPinName(pinName) {
    var routableSignals = pinName.split('/');
    for (var i = 0; i < routableSignals.length; i++) {
        if (routableSignals[i].match(ptxRegex) || routableSignals[i].match(portxRegex)) {
            var port = getPortFromPortName(routableSignals[i]);
            var pin = getPinFromPort(routableSignals[i]);
            return new Array(port, pin);
        }
    }
    return null;
}

/**
 * Function will print peripheral identifier #define directive
 */
function printIdentifierDefinePeripheral(identifierDescriptor) {
    var identifierBody = identifierDescriptor.prefix + identifierDescriptor.ipIdentifier;
    if (identifierDescriptor.printIpDefine) {
        PExOut_gen(getConstantDefinitionStr(
            identifierBody + "_PERIPHERAL",
            identifierDescriptor.peripheral,
            "Peripheral name",
            directionDefineFormat
        ));
    }
}


/**
 * Prints a message on console
 * repetitively - if false the same message is not printed more than once
 * returns nothing
 */
function logMessage(message, repetitively) {
    var index = messageList.indexOf(message);
    if (index == -1) {
        messageList.push(message);
    }
    var variant = "Unknown processor";
    if (cpuVariant != null) {
        variant = cpuVariant;
    }
    if (repetitively || (index == -1)) {
        PExOut.log(variant + ": " + message);
    }
}


/**
 * Gets bitwise or. Native bitwise operation in Javascript works only with 31-bit numbers because of implicit conversion to signed 32-bit integer.
 * a - value 1
 * b - value 2
 * returns result of bitwise OR
 */
function getBitwiseOr(a, b) {
    if (a < 0 || b < 0) {
        logMessage("One of operands (" + a + ", " + b + ") is negative number.", true);
    }
    var result = 0;
    var mask = 0xFFFF;
    var divisor = mask + 1;
    var i = 0;
    while ((a != 0) || (b != 0)) {
        var r = ((a & mask) | (b & mask));
        for (var j = 0; j < i; j++) {
            r *= divisor;
        }
        result += r;
        a = Math.floor(a / divisor);
        b = Math.floor(b / divisor);
        i++;
    }
    return result;
}

/**
 * Gets bitwise xor. Native bitwise operation in Javascript works only with 31-bit numbers because of implicit conversion to signed 32-bit integer.
 * a - value 1
 * b - value 2
 * returns result of bitwise XOR
 */
function getBitwiseXor(a, b) {
    if (a < 0 || b < 0) {
        logMessage("One of operands (" + a + ", " + b + ") is negative number.", true);
    }
    var result = 0;
    var mask = 0xFFFF;
    var divisor = mask + 1;
    var i = 0;
    while ((a != 0) || (b != 0)) {
        var r = ((a & mask) ^ (b & mask));
        for (var j = 0; j < i; j++) {
            r *= divisor;
        }
        result += r;
        a = Math.floor(a / divisor);
        b = Math.floor(b / divisor);
        i++;
    }
    return result;
}

/**
 * Gets bitwise and. Native bitwise operation in Javascript works only with 31-bit numbers because of implicit conversion to signed 32-bit integer.
 * a - value 1
 * b - value 2
 * returns result of bitwise AND
 */
function getBitwiseAnd(a, b) {
    if (a < 0 || b < 0) {
        logMessage("One of operands (" + a + ", " + b + ") is negative number.", true);
    }
    var result = 0;
    var mask = 0xFFFF;
    var divisor = mask + 1;
    var i = 0;
    while ((a != 0) && (b != 0)) {
        var r = ((a & mask) & (b & mask));
        for (var j = 0; j < i; j++) {
            r *= divisor;
        }
        result += r;
        a = Math.floor(a / divisor);
        b = Math.floor(b / divisor);
        i++;
    }
    return result;
}

/**
 * Gets bitwise 32-bit neg. Native bitwise operation in Javascript works only with 31-bit numbers because of implicit conversion to signed 32-bit integer.
 * a - value
 * returns result of bitwise 32-bit NEG
 */
function getBitwiseNeg32(a) {
    if (a < 0) {
        logMessage("Operand (" + a + ") is negative number.", true);
    }
    return getBitwiseXor(a, 0xFFFFFFFF);
}

/**
 * Gets value shifted left by a number. Native bitwise operation in Javascript works only with 31-bit numbers because of implicit conversion to signed 32-bit integer.
 * a - value which is shifted left by n 
 * n - number
 * returns shifted value
 */
function getBitwiseShiftLeft(a, n) {
    if (a < 0 || n < 0) {
        logMessage("One of operands (" + a + ", " + n + ") is negative number.", true);
    }
    return (a * Math.pow(2, n));
}


// Analyzing processor register database on XBAR, DMAMUX, TRGMUX,... existing, number of DMA instances,... And loading given informations in order to mapping on SDK functions.
var globalPcrMask = 0;
if (registerDatabaseObject != null) {
    var peripherals = registerDatabaseObject.getPeripherals();
    if (codeStyle == "SDK") {
        var loadXbar = false;
        var loadDmamux = false;
        var dbIsDMAMUX1 = false;
        var loadTrgmux = false;
        var dmaCount = 0;
        var dbIsDMA0 = false;
        var dbIsXBARA = false;
        var dbIsXBARB = false;
        var firstPcrMuxFound = false;
        for (var ip = 0; ip < peripherals.length; ip++) {
            var peripheralName = peripherals[ip].getName();
            if (peripheralName.indexOf(portPeripheralName) >= 0) {
                var peripheralRegisters = peripherals[ip].getRegisters();
                for (var ir = 0; ir < peripheralRegisters.length; ir++) {
                    var registerName = peripheralRegisters[ir].getName();
                    if (registerName.indexOf(portControlRegisterName) >= 0) {
                        globalPcrMask = getBitwiseOr(globalPcrMask, peripheralRegisters[ir].getNonReservedMask());
                        if (!firstPcrMuxFound) {
                            var bitField = peripheralRegisters[ir].findBitFieldByName(pinMuxControlBitName);
                            if (bitField != null) {
                                firstPcrMuxFound = true;
                                pinMuxControlBitMask = bitField.getRegisterMask().doubleValue();
                                portMuxMask = pinMuxControlBitMask;
                                portMuxWidth = bitField.getWidth();
                            }
                        }
                    }
                }
            }
            if (peripheralName.indexOf(xbarPeripheralName) >= 0) {
                loadXbar = true;
            }
            if (peripheralName.indexOf(dmaMuxPeripheralName) >= 0) {
                loadDmamux = true;
            }
            if (peripheralName.indexOf(trgmuxPeripheralName) >= 0) {
                loadTrgmux = true;
            }
            if (peripheralName == (dmaMuxPeripheralName + '1')) {
                dbIsDMAMUX1 = true;
            }
            if ((peripheralName.indexOf(dmaPeripheralName) >= 0) && (peripheralName.indexOf(dmaMuxPeripheralName) < 0)) {
                dmaCount += 1;
            }
            if (peripheralName == (dmaPeripheralName + '0')) {
                dbIsDMA0 = true;
            }
            if (peripheralName.indexOf(xbarPeripheralName + 'A') >= 0) {
                dbIsXBARA = true;
            }
            if (peripheralName.indexOf(xbarPeripheralName + 'B') >= 0) {
                dbIsXBARB = true;
            }
        }
        if (!firstPcrMuxFound) {
            logMessage("No " + pinMuxControlBitName + " in " + portControlRegisterName + " found.", false);
        }
        var cpuVariant = PExScript.getMacroSymbol('CPUvariant');
        var xbarModulesAB = false;
        if (dbIsXBARA || dbIsXBARB) {
            // XBAR is supported by two modules XBARA and/or XBARB
            xbarModulesAB = true;
        }
        // Loading given informations in order to mapping on SDK functions
        if (cpuVariant != null) {
            var loadingPath = "";
            if (loadXbar) {
                loadingPath = cpuVariant.valueOf() + "/XBAR.js";
                var xbarInputSignal = PExProcessor.loadPersistentObject("xbar_input_signal", loadingPath);
                var xbarOutputSignal = PExProcessor.loadPersistentObject("xbar_output_signal", loadingPath);
                if (xbarInputSignal == null || xbarOutputSignal == null) {
                    logMessage('There is problem with loading ' + loadingPath, false);
                }
            }
            if (loadDmamux) {
                loadingPath = cpuVariant.valueOf() + "/DMA.js";
                var dmaRequestSource = PExProcessor.loadPersistentObject("dma_request_source", loadingPath);
                if (dmaRequestSource == null) {
                    logMessage('There is problem with loading ' + loadingPath, false);
                }
            }
            if (loadTrgmux) {
                loadingPath = cpuVariant.valueOf() + "/TRGMUX.js";
                var trgmuxDevice = PExProcessor.loadPersistentObject("trgmux_device", loadingPath);
                var trgmuxSource = PExProcessor.loadPersistentObject("trgmux_source", loadingPath);
                if (trgmuxDevice == null || trgmuxSource == null) {
                    logMessage('There is problem with loading ' + loadingPath, false);
                }
            }
        } else {
            logMessage('CPUvariant not found.', false);
        }
    }
}

// Preparation of other information, such as Clock gate generation enable/disable, configuration strategies for getting right set register configuration for given user function
var allComponents = PExProject.getAllComponents(); // Each component represents one user function
var configurationStrategies = new Array(); // Configuration strategies for getting right set register configuration for given user function
var identifierPrefixes = new Array(); // Array of identifier prefixes of each user function
var componentCoreIds = new Array(); // Core IDs array. It says core id for each user function
var componentClockGateGeneration = new Array(); // Clock gate generation enabling options array. It says clock gate generation enabling option for each user function 
var textOptions = null;
for (var pc = 0; pc < allComponents.length; pc++) {
    currentComponent = pc;
    var funcNameItem = allComponents[pc].findItemBySymbol("FunctionName");
    if (funcNameItem != null) {
        configurationStrategies[pc] = funcNameItem.getText();
    }
    textOptions = allComponents[pc].getComponentOptions();
    if (textOptions != null) {
        var options = JSON.parse(textOptions);
        componentCoreIds.push(options["coreID"]);
        if (typeof(clockGateGeneration) == "undefined") {
            componentClockGateGeneration.push(options["enableClock"]);
        } else {
            componentClockGateGeneration.push(clockGateGeneration);
        }
        var identifierPrefix = options["prefix"];
        if (identifierPrefix == null) {
            identifierPrefixes.push((configurationStrategies[pc] + "_").toUpperCase());
        } else {
            identifierPrefixes.push(identifierPrefix);
        }
    }
}
var configurationStrategy = null;

// Getting core ids information
var coreIds = null;
var coreListTxt = PExProcessor.getCoresList();
if (coreListTxt != null) {
    coreIds = Object.keys(JSON.parse(coreListTxt));
}

// Filtering and finding cores with an assigned function
var notEmptyCoreIds = new Array();
for (var coreIndex in coreIds) {
    var coreId = coreIds[coreIndex];
    if (componentCoreIds.indexOf(coreId) > -1) {
        notEmptyCoreIds.push(coreId);
    }
}

// Initial state of helping variables because of including SDK modules in generated code
var include_fsl_port = {
    present: false,
    pcs: new Array()
};
var include_fsl_xbar = {
    present: false,
    pcs: new Array()
};
var include_fsl_xbara = {
    present: false,
    pcs: new Array()
};
var include_fsl_xbarb = {
    present: false,
    pcs: new Array()
};
var include_fsl_dmamux = {
    present: false,
    pcs: new Array()
};
var include_fsl_trgmux = {
    present: false,
    pcs: new Array()
};
var include_fsl_gpio = {
    present: false,
    pcs: new Array()
}

/* c indentation 2 */
var cIndent2 = '  ';
/* c indentation 4 */
var cIndent4 = '    ';
/* c indentation 6 */
var cIndent6 = '      ';
/* c indentation 8 */
var cIndent8 = '        ';

/* PE DEBUG mode flag */

// For debug pusposes in the future
//var PE_DEBUG = PExScript.getMacroSymbol("PE_DEBUG");


/**
 * Gets string value with one symbolic constant taken from passed array of sumbolic constants. It is intended to use as one line of or "or" expression.
 * constants - array of symbolic constants which should be ored together, e.g. [PORT_DFER_DFE_1_MASK, PORT_DFER_DFE_5_MASK, PORT_DFER_DFE_6_MASK]
 * index - item index in symbolic constants array; the range is o to constants.length - 1, e.g,: 0, 1, 2 (function is 3 times invoked)
 * endingString - string for last item in constants is ended with this character (typically "," or "")
 * returns bit field mask string out of XML register database using CMSIS alias attribute value, e.g. PORT_DFER_DFE_1_MASK for index=0, "| PORT_DFER_DFE_5_MASK" for index=1, "| PORT_DFER_DFE_6_MASK," for index=2
 */
function getBitFieldArrayOrMaskItem(constants, index, endingStr) {
    var str = '';
    var length = constants.length;
    if (index == 0) {
        if (length > 1) {
            str = '  ';
        }
        str += constants[0];
    } else {
        str += ('| ' + constants[index]);
    }
    if (index >= (length - 1)) {
        str += endingStr;
    }
    return str;
}


/**
 * Gets string value for usage within the set bit-field macro statement for clearing set bits. It is intended for bit field arrays.
 * dbBitField - database bit field object to get bit field mask string
 * itemIndex - item index in bit field array
 * returns bit field mask string out of XML register database using CMSIS alias attribute value (e.g. PORT_DFER_DFE_5)
 */
function getBitFieldArrayMaskStr(dbBitField, itemIndex) {
    var bitFieldMaskAlias = dbBitField.getAlias("CMSIS");
    return (bitFieldMaskAlias.replace("(x)", "_" + itemIndex));
}

/**
 * Gets string value with x instead of item number. It is intended for bit field arrays.
 * dbBitField - database bit field object to get bit field mask string
 * returns bit field mask string out of XML register database using CMSIS alias attribute value (e.g. PORT_DFER_DFE_x)
 */
function getBitFieldArrayXMaskStr(dbBitField) {
    var bitFieldMaskAlias = dbBitField.getAlias("CMSIS");
    return (bitFieldMaskAlias.replace("(x)", "_x"));
}

/**
 * Gets string with bit field value with x instead of item number. It is intended for bit field arrays.
 * dbBitFieldValues - bit field values
 * bitFieldValueX - numeric value used if bit field value is empty
 * returns bit field mask string out of XML register database using CMSIS alias attribute value (e.g. DFER_DFE_x_ENABLED or DFER_DFE_x_DISABLED)
 */
function getBitFieldArrayValueXStr(dbBitFieldValues, bitFieldValueX) {
    var bitFieldXValue = new Array();
    if (dbBitFieldValues != null) {
        var splitBitFieldValues = new Object();
        var splitSelectedBitFieldValue = new Array();
        for (var v = 0; v < dbBitFieldValues.length; v++) {
            splitBitFieldValues[v] = dbBitFieldValues[v].getName().split("_");
            if (dbBitFieldValues[v].getValue() == bitFieldValueX) {
                splitSelectedBitFieldValue = splitBitFieldValues[v];
            }
        }
        var theSamePart = true;
        for (var i = 0; i < splitSelectedBitFieldValue.length; i++) {
            var splitSelectedBitFieldValuePart = splitSelectedBitFieldValue[i];
            for (var v = 0; v < dbBitFieldValues.length; v++) {
                var splitBitFieldValue = splitBitFieldValues[v];
                if (splitSelectedBitFieldValuePart != splitBitFieldValue[i]) {
                    theSamePart = false;
                }
            }
            if (!theSamePart) {
                bitFieldXValue.push("x");
            }
            bitFieldXValue.push(splitSelectedBitFieldValuePart);
        }
    }
    return bitFieldXValue.join("_");
}

/**
 * Gets string value for usage within the set bit-field macro statement for clearing set bits
 * dbBitField - database bit field object to get bit field mask string
 * returns bit field mask string out of XML register database using CMSIS alias attribute value (e.g. PORT_PCR_MUX_MASK)
 */
function getBitFieldMaskStr(dbBitField) {
    var bitFieldMaskAlias = dbBitField.getAlias("CMSIS");
    return bitFieldMaskAlias.replace("(x)", "_MASK");
}

/**
 * Gets string value for usage within the set bit-field macro statement for clearing set bits
 * dbBitField - database bit field object to get bit field mask string
 * returns bit field mask string out of XML register database using CMSIS alias attribute value (e.g. PORT_PCR_MUX(x))
 */
function getBitFieldStr(dbBitField) {
    return dbBitField.getAlias("CMSIS");
}


/**
 * Gets register name string in order to access the register in printed code 
 * registerName - full register name (e.g. TRGMUX_FTM1)
 * returns register name string for access in code (e.g. "TRGCFG[11]")
 */
function getRegisterNameStr(registerName) {
    var dbRegister = registerDatabaseObject.getRegisterByFullName(registerName);
    var dbPeripheral = registerDatabaseObject.getPeripheralByFullName(registerName);
    return dbPeripheral.getName() + "->" + dbRegister.getAlias("CMSIS");
}


/**
 * Gets value converted to hex format 
 * bitFieldValueX - number for conversion
 * returns converted value (e.g. 0x0Fu)
 */
function getNumberConvertedToHex(bitFieldValueX) {
    var BigInteger = Java.type("java.math.BigInteger");
    var bigInt = new BigInteger(bitFieldValueX.toString());
    var hexNumberPart = bigInt.toString(16).toUpperCase();
    if (hexNumberPart.length % 2 == 1) {
        hexNumberPart = "0" + hexNumberPart;
    }
    return ("0x" + hexNumberPart + "u");
}


/**
 * Removes '.' at the end of the description if it is there
 * descr - string which contains a description, e.g. "CMP1 Output output assigned to XBARB_IN1 input."
 * returns improved string, e.g "CMP1 Output output assigned to XBARB_IN1 input"
 */
function removeLastDotFromDescription(descr) {
    var firstDotPosition = descr.indexOf('.');
    var lastPos = descr.length - 1;
    while (descr.charAt(lastPos) == ' ') {
        lastPos--;
    }
    if (descr.charAt(lastPos) == '.') {
        lastPos--;
    }
    return (descr.substring(0, lastPos + 1));
}

/**
 * Gets formatted constant definition string
 * code - string which contains a code
 * comment - string which contains a comment
 * format - determines format of the line with #define. It is optional parameter. If it is null then defaultDefineFormat is used
 * returns constant definition string, e.g #define SOPT_ADCAALTTRGEN_XBAR 0x00u  // ADCA alternate trigger enable: XBARA ...
 */
function getConstantDefinitionStr(name, value, comment, format) {
    if (format == null) {
        var f = defaultDefineFormat;
    } else {
        var f = format;
    }

    var line = "#define " + name + " " + value;
    var commentBody = "/*!<@brief " + comment + " */";

    if (defineLineLength < 0) {
        commentBody = normalizeBriefComment("/*!\n * @brief " + comment + " */");
        line = commentBody + "\n" + line;
    } else {
        line += " ";
        line = line + makeString(' ', defineLineLength - line.length) + commentBody;
    }
    return (line);
}

/**
 * Adds a comment on a column
 * code - string which contains a code
 * comment - string which contains a comment
 * returns <code>     {a column}// comment
 */
function addCCodeComment(code, comment) {
    var line = code + " ";
    var spaces = cCodeCommentColumn - line.length + 1;
    var indent = makeString(' ', spaces);
    return (line + indent + makeComment(comment));
}

/**
 * Function adds opening and closing block comment tag to comment text defined by parameter
 */
function makeComment(comment) {
    return '/* ' + comment + ' */';
}

/**
 * Function should get the identifier of peripheral, this time it is just the placeholder. 
 * Currently this returns only name of the peripheral.
 * In future, it could return the peripheral identifier from Peripherals tool.
 */
function getPeripheralIdentifier(peripheralItem) {
    return '';
    //return peripheralItem.getTextValue();
}

/**
 * Gets whole line including comment which set bit field starting with "|"
 * dbBitField - reference to database bit field
 * bitFieldValueX - numeric value used if bit field value is empty
 * bfVal - bit field value, e.g. PCR_SRE_PCR_SRE_FASLT
 * bfDescr - bit field description, e.g. Slew Rate Enable: Fast slew rate is configured on the corresponding pin, if the pin is configured as a digital output.  
 * returns e.g. | PORT_PCR_SRE(PCR_SRE_PCR_SRE_FASLT) // Slew Rate Enable: Fast slew rate is configured on the corresponding pin, if the pin is configured as a digital output. 
 *           or | DMAMUX_CHCFG_SOURCE(0x02u)       // DMA Channel Source (Slot): 0x02u"
 */
function getBitFieldSetMaskString(dbBitField, bitFieldValueX, bfVal, bfDescr) {
    if (bfVal == "") {
        bfVal = getNumberConvertedToHex(bitFieldValueX);
        if (bfDescr == "") {
            bfDescr = dbBitField.getDescription() + ": " + bfVal;
        }
    }
    // return (addCCodeComment(cIndent6 + '| ' + getBitFieldStr(dbBitField).replace("(x)",  "(" + bfVal + ")"), bfDescr));
    return (formatComment(9, makeComment(bfDescr)) + '\n' + cIndent8 + ' | ' + getBitFieldStr(dbBitField).replace("(x)", "(" + bfVal + ")"));
}

/**
 * Function finds comment in input text. 
 * Returns comment if present, or empty string if not.
 */
function getComment(text) {
    var comment = (text.match(commentRegex));
    return (comment) ? comment[0] : "";
}

/**
 * Function divides bitfield 'OR' masks to lines with indentation in order to preserve Clang formatting
 */
function formatBitFieldClrMasks(masks) {
    var formattedMask = '';
    var lineLen = 13;

    for (var i = 0; i < masks.length; i++) {
        if ((lineLen + 2 + masks[i].length) > 115) {
            formattedMask += '\n' + makeString(' ', 13) + '| ';
            lineLen = 13 + 2;
        }
        formattedMask += masks[i] + ((i = masks.length - 1) ? '' : '| ');
        lineLen += masks[i].length + 2;
    }
    return formattedMask;
}

function getBlockCommentText(comment) {
    return comment.trim().replace(/\/\*[\s\*\n]*/, '').replace(/[\s\*\n]*\*\//, '');
}

// Format comment to indented lines with length < 120
function normalizeComment(comment, indent) {
    // Get raw comment content without comment initial and ending marks, asterisks etc...
    var commentContent = getBlockCommentText(comment.replace(commentDividersRegex, ' '));
    // Divide comment into sentences and remove empty ones
    var commentSentences = commentContent.split('.').filter(Boolean);
    // Format sentences to be divided into lines shorter than 120 characters including indentation and initial asterisks
    var formattedComment = commentSentences
        .map(function(sentence) {
            return getCommentLinesFromSentence(sentence, indent)
                .join('\n' + makeString(' ', indent) + ' * ')
        })
        .join('\n' + makeString(' ', indent) + ' *');
    // Return formatted comment with initial and ending characters
    return makeString(' ', indent) + '/*' + formattedComment + ' */';
}


/**
 * Function reformats bitfieldSetMaskString
 */
function formatBitFieldSetMaskString(bfSetMaskString, indent) {
    // delete comment from input text in parameter
    var comment = normalizeComment(getComment(bfSetMaskString), indent);
    var mask = bfSetMaskString.replace(commentRegex, '');

    // trim spaces from setMaskString
    mask = mask.trim();
    return (comment + '\n' + makeString(' ', indent) + mask);
}

function getPullSelectMaskString(bfVal, bfDescr) {
    // getBitFieldSetMaskString(dbBitFields[fi], bitFieldValueX, bfVal, bfDescr)
    return (addCCodeComment(cIndent6 + '| ' + '(uint32_t)(' + bfVal + ')', bfDescr));
}

/**
 * Gets description for bit field configuration in format <bit field description paarameter> (typically contains bit field description): <bit field value description corresponding to a value in bitFieldValueX>
 * dbBitFieldValues - bit field values
 * bitFieldValueX - numeric value used if bit field value is empty
 * bitFieldDescription - bit field description, e.g. "Slew Rate Enable" or "DMA Channel Source (Slot)"  
 * returns e.g. "Slew Rate Enable: Fast slew rate is configured on the corresponding pin, if the pin is configured as a digital output." 
 *           or "DMA Channel Source (Slot): 0x02u"
 */
function getBitFieldSetMaskDescription(dbBitFieldValues, bitFieldValueX, bitFieldDescription) {
    var bfDescr = "";
    if (dbBitFieldValues != null) {
        for (var v = 0; v < dbBitFieldValues.length; v++) {
            if (dbBitFieldValues[v].getValue() == bitFieldValueX) {
                bfDescr = bitFieldDescription + ": " + dbBitFieldValues[v].getDescription();
            }
        }
    }
    if (bfDescr == "") {
        bfDescr = bitFieldDescription + ": " + getNumberConvertedToHex(bitFieldValueX);
    }
    return bfDescr;
}


/**
 * Gets port initial according to full register name
 * registerName - full register name (e.g. PORTE_PCR16)
 * returns gpio initial (e.g. E)
 */
function getPortInitialStr(registerName) {
    var indexOfPort = registerName.indexOf(portPeripheralName);
    if (indexOfPort >= 0) {
        return (registerName.substring(indexOfPort + portPeripheralName.length, indexOfPort + portPeripheralName.length + 1));
    }
    return "";
}

/**
 * Gets gpio initial according to full register name
 * registerName - full register name (e.g. PORTE_PCR16)
 * returns gpio initial (e.g. E)
 */
function getGpioInitialStr(registerName) {
    var indexOfGpio = registerName.indexOf(gpioPeripheralName);
    if (indexOfGpio >= 0) {
        return (registerName.substring(indexOfGpio + gpioPeripheralName.length, indexOfGpio + gpioPeripheralName.length + 1));
    }
    return "";
}

/**
 * Gets port index according to full register name
 * registerName - full register name (e.g. PORTE_PCR16)
 * returns port index (e.g. 16)
 */
function getPortIndexStr(registerName) {
    var indexOfPcr = registerName.indexOf(portControlRegisterName);
    if (indexOfPcr >= 0) {
        return (registerName.substring(indexOfPcr + portControlRegisterName.length));
    }
    return "";
}

/**
 * Gets gpio index according to full register name
 * registerName - full register name (e.g. GPIOE_PCR16)
 * returns gpio index (e.g. 16)
 */
function getGpioIndexStr(registerName) {
    return registerName[4];
}

/**
 * Gets port initials according to full register name
 * registerName - full register name (e.g. GPIOE_PCR16)
 * returns port function (e.g. E16)
 */
function getPortInitialsStr(registerName) {
    return (getPortInitialStr(registerName) + getPortIndexStr(registerName));
}

/**
 * Gets gpio initials according to full register name
 * registerName - full register name (e.g. GPIOE_PDDR)
 * returns port function (e.g. PDDR)
 */
function getGpioInitialsStr(registerName) {
    return (getGpioInitialStr(registerName));
}


/**
 * Gets pin coordinates according to selected pin function (according to pin routing)
 * registerName - full register name which is modified
 * mask - mask of register bits which are modified
 * returns pin part name (e.g. 5 for [5] UART1_TX)
 */
function getSelectedPinCoordinatesStr(registerName, mask) {
    var itemList = PExProcessor.getOwnerPropertiesForRegisterFromPrphsModel(registerName, java.math.BigInteger.valueOf(mask), false, configurationStrategy, null);
    var selectedPinCoordinates = new Array();
    for (var iItem = 0; iItem < itemList.length; iItem++) {
        var coordinate = itemList[iItem].getSelectedPinCoordinates();
        if (selectedPinCoordinates.indexOf(coordinate) == -1) {
            selectedPinCoordinates.push(coordinate);
        }
    }
    return selectedPinCoordinates.join("_");
}

/**
 * Gets pin part name according to selected pin function (according to pin routing)
 * registerName - full register name which is modified
 * mask - mask of register bits which are modified
 * returns pin part name (e.g. UART1_TX)
 */
function getSelectedPinNamePartStr(registerName, mask) {
    var itemList = PExProcessor.getOwnerPropertiesForRegisterFromPrphsModel(registerName, java.math.BigInteger.valueOf(mask), false, configurationStrategy, null);
    var selectedPinNameParts = new Array();
    for (var iItem in itemList) {
        var pinNamePart = itemList[iItem].getSelectedPinNamePart();
        if (selectedPinNameParts.indexOf(pinNamePart) == -1) {
            selectedPinNameParts.push(pinNamePart);
        }
    }
    return selectedPinNameParts.join(", ");
}

/**
 * Gets if pin is disabled or not (according to pin routing). the disabled means setting ALT0 althought there is no function for ALT0
 * registerName - full register name which is modified
 * mask - mask of register bits which are modified
 * returns true/false
 */
function isPinDisabled(registerName, mask) {
    var itemList = PExProcessor.getOwnerPropertiesForRegisterFromPrphsModel(registerName, java.math.BigInteger.valueOf(mask), false, configurationStrategy, null);
    if ((itemList != null) && (itemList.length > 0)) {
        var peripheralSignal = itemList[0].getRoutedPeripheralSignal();
        if (peripheralSignal == 'disabled' || peripheralSignal == 'Disabled') {
            return true;
        }
    }
    return false;
}

function isNotBoundedPin(coordinates) {
    if (/-/.test(coordinates) || /\//.test(coordinates)) {
        return true;
    }
    return false;
}


/**
 * Gets routed peripheral name according to register and mask (according to pin routing)
 * registerName - full register name which is modified
 * mask - mask of register bits which are modified
 * returns array of routed peripheral names (e.g. [UART1, UART2])
 */
function getRoutedPeripheralNames(registerName, mask) {
    var itemList = PExProcessor.getOwnerPropertiesForRegisterFromPrphsModel(registerName, java.math.BigInteger.valueOf(mask), false, configurationStrategy, null);
    var peripheralNames = new Array();
    for (var iItem in itemList) {
        var peripheralName = itemList[iItem].getRoutedPeripheralName().valueOf();
        if (peripheralNames.indexOf(peripheralName) == -1) {
            peripheralNames.push(peripheralName);
        }
    }
    return peripheralNames;
}

/**
 * Gets reset value of register from database
 * dbReg - reference to database register
 * returns reset value
 */
function getResetValue(dbReg) {
    var value = java.math.BigInteger.valueOf(0);
    var dbBitFields = dbReg.getBitFields();
    for (var fi = 0; fi < dbBitFields.length; fi++) {
        var dbBitField = dbBitFields[fi];
        value = getBitwiseOr(value, getBitwiseShiftLeft(dbBitField.getResetValue().doubleValue(), dbBitField.getOffset()));
    }
    return (value);
}

/**
 * Gets register mask of no read only bits
 * dbReg - reference to database register
 * returns non read only mask
 */
function getNonReadOnlyMask(dbReg) {
    var mask = java.math.BigInteger.valueOf(0);
    var dbBitFields = dbReg.getBitFields();
    for (var fi = 0; fi < dbBitFields.length; fi++) {
        var dbBitField = dbBitFields[fi];
        if (dbBitField.isReadOnly()) {
            mask = getBitwiseOr(mask, dbBitField.getRegisterMask().doubleValue());
        }
    }
    return getBitwiseXor(dbReg.getMask().doubleValue(), mask);
}


/**
 * Registers constant definition into constant definitions list in order to print them into output code. 
 * objName - object name in constant definitions collection; the same as name; if a number is inside, the number is normalize because of sorting
 * name - name of symbolic constant
 * value - value of symbolic constant
 * comment - comment for symbolic constant
 * valueType type of value:
 *     - index (number is not converted to hex)
 *     - mask or another from index (number is converted to hex)      
 * configurationConstantDefinitionList - reference to constant definition list for a configuration     
 * return no value
 */
function registerConstantDefinition(objName, name, value, comment, valueType, configurationConstantDefinitionList) {
    var def = configurationConstantDefinitionList[objName];
    if (def == null) {
        configurationConstantDefinitionList[objName] = new Object();
        configurationConstantDefinitionList[objName].name = name;
        configurationConstantDefinitionList[objName].value = value;
        configurationConstantDefinitionList[objName].comment = comment;
        if (valueType == 'index') {
            configurationConstantDefinitionList[objName].indexType = '';
        }
    }
}


/**
 * Convert number to string and adding zeroes on the left so that resulting string has length 3
 * x - number
 * return converted number
 */
function normalizeNumberStr(x) {
    var str = x.toString();
    while (str.length < 3) {
        str = '0' + str;
    }
    return str;
}

/**
 * Analyzes bit fields of the register and do requested action, e.g. printing configuration CMSIS code, finding constant for definitions. 
 * reg - reference to registers specified by registerName, registerClrMask and registerSetMask 
 * action - defines action:
 *   - print - writes CMSIS code into ouput
 *   - constantDefinitions - gets array of constants specified by name, value and description for both clr and set masks    
 *   - onlyMaskConstantDefinitions - gets array of constants specified by name, value and description with MASK at the end of the name
 * configurationConstantDefinitionList - reference to constant definition list for a configuration     
 * return no value
 */
function processRegister(reg, action, configurationConstantDefinitionList) {
    // Clear informations about pull select and pull enable stored from previous register
    pullStruct.dbBitField = '';
    pullStruct.bitFieldValueX = -1;
    pullStruct.bfVal = '';
    pullStruct.bfDescr = '';
    pullStruct.PSFound = false;
    pullStruct.PEFound = false;

    var retValue = '';
    switch (action) {
        case "constantDefinitions":
            var registerClrSetMask = getBitwiseOr(reg.registerClrMask, reg.registerSetMask);
            break;
        default:
            var registerClrSetMask = getBitwiseOr(reg.registerClrMask, reg.registerSetMask);
    }
    var dbRegister = registerDatabaseObject.getRegisterByFullName(reg.registerName);
    if (registerClrSetMask != 0) {
        if (dbRegister != null) {
            var dbBitFields = dbRegister.getBitFields();
            var bitFieldClrMasksString = new Array();
            var bitFieldSetMasksString = new Array();
            for (var fi = 0; fi < dbBitFields.length; fi++) {
                var bitFieldMask = dbBitFields[fi].getRegisterMask().doubleValue();
                var str = getSafeBitFieldBy0MaskStr(reg, dbBitFields[fi]);
                if (str != "") {
                    bitFieldClrMasksString.push(str);
                }
                if ((getBitwiseAnd(bitFieldMask, registerClrSetMask)) > 0) {
                    var registerName = dbRegister.getName();
                    var bitFieldName = dbBitFields[fi].getName();
                    var bfVal = "";
                    var bfValValue = "";
                    var bfDescr = "";
                    var dbBitFieldValues = dbBitFields[fi].getValues();
                    var bitFieldValueX = getBitwiseAnd(reg.registerSetMask, bitFieldMask) >>> dbBitFields[fi].getOffset();
                    if (dbBitFields[fi].isArray()) {
                        var itemWidth = dbBitFields[fi].getItemWidth();
                        var width = dbBitFields[fi].getWidth();
                        var numberOfItems = width / itemWidth;
                        var itemRegisterMask = 0;
                        for (var i = 0; i < itemWidth; i++) {
                            itemRegisterMask = getBitwiseOr(itemRegisterMask, getBitwiseShiftLeft(1, i));
                        }
                        itemRegisterMask = getBitwiseShiftLeft(itemRegisterMask, dbBitFields[fi].getOffset());
                        for (var fai = 0; fai < numberOfItems; fai++) {
                            var itemMask = getBitwiseShiftLeft(itemRegisterMask, (fai * itemWidth));
                            if (getBitwiseAnd(itemMask, registerClrSetMask)) {
                                var defName = getBitFieldArrayMaskStr(dbBitFields[fi], fai) + '_MASK';
                                bitFieldClrMasksString.push(defName);
                                switch (action) {
                                    case "constantDefinitions":
                                    case "onlyMaskConstantDefinitions":
                                        registerConstantDefinition(defName, defName, itemMask, dbBitFields[fi].getDescription() + " Mask for item " + fai + ".", 'mask', configurationConstantDefinitionList)
                                        retValue = getBitFieldArrayXMaskStr(dbBitFields[fi]) + '_MASK';
                                        break;
                                }
                            }
                            if (itemWidth == 1) {
                                if (getBitwiseAnd(itemMask, registerClrSetMask)) {
                                    if (dbBitFieldValues != null) {
                                        for (var v = 0; v < dbBitFieldValues.length; v++) {
                                            var bitFieldValueXItemMask = getBitwiseAnd(bitFieldValueX, itemMask);
                                            if (getBitwiseAnd((getBitwiseShiftLeft(dbBitFieldValues[v].getValue(), (fai * itemWidth))), itemMask) == bitFieldValueXItemMask) {
                                                bfVal = getBitFieldArrayValueXStr(dbBitFieldValues, bitFieldValueXItemMask >>> (fai * itemWidth)).replace('x', fai);
                                                bfDescr = dbBitFields[fi].getDescription() + ": " + dbBitFieldValues[v].getDescription();
                                                switch (action) {
                                                    case "print":
                                                        bitFieldSetMasksString.push(getBitFieldSetMaskString(dbBitFields[fi], bitFieldValueX, bfVal, bfDescr));
                                                        break;
                                                    case "constantDefinitions":
                                                        bfValValue = getBitwiseShiftLeft(dbBitFieldValues[v].getValue(), (fai * itemWidth));
                                                        registerConstantDefinition(bfVal, bfVal, bfValValue, bfDescr, 'mask', configurationConstantDefinitionList);
                                                        break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        bitFieldClrMasksString.push(getBitFieldMaskStr(dbBitFields[fi]));
                        if (!testMode && action == "print" && registerName.indexOf(portControlRegisterName) >= 0 && bitFieldName == pinMuxControlBitName) {
                            if (!isPinDisabled(reg.registerName, portMuxMask)) {
                                var comment = 'PORT' + getPortInitialsStr(reg.registerName) + ' (pin ' + getSelectedPinCoordinatesStr(reg.registerName, portMuxMask) + ') is configured as ' + getSelectedPinNamePartStr(reg.registerName, portMuxMask);
                            } else {
                                var comment = 'PORT' + getPortInitialsStr(reg.registerName) + ' (pin ' + getSelectedPinCoordinatesStr(reg.registerName, portMuxMask) + ') is disabled';
                            }
                            bfDescr = dbBitFields[fi].getDescription() + ": " + comment;
                        }
                        if (dbBitFieldValues != null) {
                            for (var v = 0; v < dbBitFieldValues.length; v++) {
                                if (dbBitFieldValues[v].getValue() == bitFieldValueX) {
                                    bfVal = dbBitFieldValues[v].getName();
                                    bfValValue = dbBitFieldValues[v].getValue().doubleValue();
                                }
                            }
                        }
                        if (bfDescr == "") {
                            bfDescr = getBitFieldSetMaskDescription(dbBitFieldValues, bitFieldValueX, dbBitFields[fi].getDescription());
                        }
                        switch (action) {
                            case "print":
                                bfVal = checkMask(bfVal);

                                // Section handling case if bitfield is related to PullUp/Down/Enable/Disable
                                if (startsWith(bfVal, 'kPORT_Pull')) {
                                    if (startsWith(bfVal, 'kPORT_PullDown') || startsWith(bfVal, 'kPORT_PullUp')) {
                                        pullStruct.dbBitField = dbBitFields[fi];
                                        pullStruct.bitFieldValueX = bitFieldValueX;
                                        pullStruct.bfVal = bfVal;
                                        pullStruct.bfDescr = bfDescr;
                                        pullStruct.PSFound = true;
                                    }

                                    if (startsWith(bfVal, 'kPORT_PullEnable')) {
                                        pullStruct.PEFound = true;
                                        if (pullStruct.PSFound) {
                                            bitFieldSetMasksString.push(getPullSelectMaskString(pullStruct.bfVal, pullStruct.bfDescr));
                                        } else {
                                            bitFieldSetMasksString.push(getPullSelectMaskString('PORT_PCR_PE_MASK', 'Pull Enable: Internal pullup or pulldown resistor is enabled on the corresponding pin.'));
                                        }
                                    }

                                    if (startsWith(bfVal, 'kPORT_PullDisable')) {
                                        pullStruct.PEFound = true;
                                        if (pullStruct.PSFound) {
                                            bitFieldSetMasksString.push(getBitFieldSetMaskString(pullStruct.dbBitField, pullStruct.bitFieldValueX, pullStruct.bfVal, pullStruct.bfDescr));
                                            bitFieldSetMasksString.push(getBitFieldSetMaskString(dbBitFields[fi], bitFieldValueX, bfVal, bfDescr));
                                        } else {
                                            bitFieldSetMasksString.push(getBitFieldSetMaskString(dbBitFields[fi], bitFieldValueX, bfVal, bfDescr));
                                        }
                                    }
                                    // End of section handling case if bitfield is related to PullUp/Down/Enable/Disable
                                } else {
                                    bitFieldSetMasksString.push(getBitFieldSetMaskString(dbBitFields[fi], bitFieldValueX, bfVal, bfDescr));
                                }
                                break;
                            case "constantDefinitions":
                                if (bfVal != "") {
                                    if (!(keyExists(bfVal, driverConstants))) {
                                        registerConstantDefinition(bfVal, bfVal, bfValValue, bfDescr, 'mask', configurationConstantDefinitionList);
                                    }
                                }
                                break;
                        }
                    }
                }
            }

            if ((pullStruct.PSFound) && (!(pullStruct.PEFound))) {
                bitFieldSetMasksString.push(getBitFieldSetMaskString(pullStruct.dbBitField, pullStruct.bitFieldValueX, pullStruct.bfVal, pullStruct.bfDescr));
            }

            switch (action) {
                case "print":
                    var bitFieldClrMasksJoinedString = bitFieldClrMasksString.join(" | ");
                    var accessRegisterName = getRegisterNameStr(reg.registerName);
                    var printOnNextLine = ((makeString(' ', accessRegisterName.length + 9) + '(~(' + bitFieldClrMasksJoinedString + ')))').length > 120);
                    PExOut_gen('\n' + cIndent4 + accessRegisterName + ' =' + (printOnNextLine ? '\n' + cIndent8 : " ") + '((' + accessRegisterName + ' &');
                    PExOut_gen(makeString(' ', (printOnNextLine ? 10 : accessRegisterName.length + 9)) + makeComment('Mask bits to zero which are setting'));
                    PExOut_gen(makeString(' ', (printOnNextLine ? 10 : accessRegisterName.length + 9)) + '(~(' + bitFieldClrMasksJoinedString + ')))');
                    for (var mi = 0; mi < bitFieldSetMasksString.length; mi++) {
                        PExOut_gen('\n' + formatBitFieldSetMaskString(bitFieldSetMasksString[mi], (printOnNextLine ? 9 : accessRegisterName.length + 8)) + ((mi == bitFieldSetMasksString.length - 1) ? ');' : ''));
                    }
                    break;
            }
        } else {
            PExOut_gen(cIndent4 + "/* There is no register " + reg.registerName + " in register database. */");
        }
    }
    if (retValue != '') {
        return retValue;
    }
}


// List of peripherals which are related to pin muxing. Do not add normal peripherals like ADC, TPM, PDB, etc. No register shoul be initialized because of pin muxing.
// If this happens then a message is logged. Launching "Generate All Pins Configuration" action in the tool and taking a look into log is good to check a signal_configuration.xml on this.
var enableClockTable = {
    "PORTA": {
        "state": "kCLOCK_PortA",
        "comment": ""
    },
    "PORTB": {
        "state": "kCLOCK_PortB",
        "comment": ""
    },
    "PORTC": {
        "state": "kCLOCK_PortC",
        "comment": ""
    },
    "PORTD": {
        "state": "kCLOCK_PortD",
        "comment": ""
    },
    "PORTE": {
        "state": "kCLOCK_PortE",
        "comment": ""
    },
    "PORTF": {
        "state": "kCLOCK_PortF",
        "comment": ""
    },
    "PORTG": {
        "state": "kCLOCK_PortG",
        "comment": ""
    },
    "PORTH": {
        "state": "kCLOCK_PortH",
        "comment": ""
    },
    "PORTI": {
        "state": "kCLOCK_PortI",
        "comment": ""
    },
    "PORTJ": {
        "state": "kCLOCK_PortJ",
        "comment": ""
    },
    "PORTK": {
        "state": "kCLOCK_PortK",
        "comment": ""
    },
    "PORTL": {
        "state": "kCLOCK_PortL",
        "comment": ""
    },
    "PORTM": {
        "state": "kCLOCK_PortM",
        "comment": ""
    },
    "PORTN": {
        "state": "kCLOCK_PortN",
        "comment": ""
    },
    "PORTO": {
        "state": "kCLOCK_PortO",
        "comment": ""
    },
    "PORTP": {
        "state": "kCLOCK_PortP",
        "comment": ""
    },
    "PORTQ": {
        "state": "kCLOCK_PortQ",
        "comment": ""
    },
    "PORTR": {
        "state": "kCLOCK_PortR",
        "comment": ""
    },
    "PORTS": {
        "state": "kCLOCK_PortS",
        "comment": ""
    },
    "PORTT": {
        "state": "kCLOCK_PortT",
        "comment": ""
    },
    "PORTU": {
        "state": "kCLOCK_PortU",
        "comment": ""
    },
    "PORTV": {
        "state": "kCLOCK_PortV",
        "comment": ""
    },
    "PORTW": {
        "state": "kCLOCK_PortW",
        "comment": ""
    },
    "PORTX": {
        "state": "kCLOCK_PortX",
        "comment": ""
    },
    "PORTY": {
        "state": "kCLOCK_PortY",
        "comment": ""
    },
    "PORTZ": {
        "state": "kCLOCK_PortZ",
        "comment": ""
    },
    "XBAR": {
        "state": "kCLOCK_Xbar",
        "comment": ""
    },
    "XBARA": {
        "state": "kCLOCK_XbarA",
        "comment": ""
    },
    "XBARB": {
        "state": "kCLOCK_XbarB",
        "comment": ""
    },
    "DMAMUX": {
        "state": "kCLOCK_Dmamux0",
        "comment": ""
    },
    "DMAMUX0": {
        "state": "kCLOCK_Dmamux0",
        "comment": ""
    },
    "DMAMUX1": {
        "state": "kCLOCK_Dmamux1",
        "comment": ""
    },
    "TRGMUX": {
        "state": "kCLOCK_Trgmux0",
        "comment": ""
    },
    "TRGMUX0": {
        "state": "kCLOCK_Trgmux0",
        "comment": ""
    },
    "TRGMUX1": {
        "state": "kCLOCK_Trgmux1",
        "comment": ""
    },
}

/**
 * Puts calling CLOCK_EnableClock including const data structure which defines pin functional properties and pin muxing into output 
 * accessRegs - reference to registers to be configured with theirs values
 * return no value; just prining into ouput
 */
function printEnableClock(accessRegs) {
    var accessRegister = accessRegs[0];
    var reg = accessRegister.register;
    var clockGateName = reg.registerName;
    var enableClockTableItem = enableClockTable[clockGateName];
    if (enableClockTableItem != null) {
        var comment = enableClockTableItem.comment;
        if (comment == "") {
            comment = reg.comment;
        }
        PExOut_gen(cIndent4 + makeComment(comment) + '\n' + cIndent4 + 'CLOCK_EnableClock(' + enableClockTableItem.state + ');');
        //PExOut_gen(addCCodeComment(cIndent4 + 'CLOCK_EnableClock(' + enableClockTableItem.state + ');', comment));
        reg.writeFunctions = null;
    } else {
        logMessage('The peripheral ' + clockGateName + ' is not in clock gate table. Probably in generated code, there is configured register which should not be (e.g. of ADC, TPM, PDB,...). Then check processor data. If not then enableClockTable should be updated in pins tool driver.', false);
        if (testMode) {
            PExOut_gen(cIndent2 + '#error The peripheral ' + clockGateName + ' is not in clock gate table. Probably in generated code, there is configured register which should not be (e.g. of ADC, TPM, PDB,...). Then check processor data. If not then enableClockTable should be updated in pins tool driver.');
        }
    }
}


/**
 * Registers using SDK function CLOCK_EnableClock 
 * reg - register defined by name, clr mask and set mask
 * writeFunctions - reference to writeFunctions array (collection of data for SDK write functions) 
 * return no value
 */
function enrolEnableClock(reg, writeFunctions) {
    var writeFunc = new Object();
    writeFunc.printFunction = printEnableClock;
    writeFunc.accessRegisters = new Array();
    var accessRegister = new Object();
    accessRegister.register = reg;
    writeFunc.accessRegisters.push(accessRegister);
    var writeFunctionsIndex = writeFunctions.push(writeFunc) - 1;
    reg.registerClrMask = 0;
    reg.registerSetMask = 0;
    if (reg.writeFunctions == null) {
        reg.writeFunctions = new Array();
    }
    reg.writeFunctions.push(writeFunctions[writeFunctionsIndex]);
}

// Data object based on typedef struct _port_pin_config in fsl_port.h
// "configure" means if corresponding item in structure definition is conditioned or not, e.g. #if defined(FSL_FEATURE_PORT_HAS_OPEN_DRAIN) && FSL_FEATURE_PORT_HAS_OPEN_DRAIN
var setPinConfigTable = {
    // SDK changed (pull elect and enable merged):
    0x0003: {
        "0": {
            "state": "kPORT_PullDisable",
            "description": "Internal pull-up/down resistor is disabled"
        },
        "1": {
            "state": "notSupported",
            "description": "In this case, the sdk function cannot be used"
        },
        "2": {
            "state": "kPORT_PullDown",
            "description": "Internal pull-down resistor is enabled"
        },
        "3": {
            "state": "kPORT_PullUp",
            "description": "Internal pull-up resistor is enabled"
        },
        "offset": "0",
        "configure": "optional"
    }, //PS, PE
    //0x0001: {"0": {"state": "kPORT_PullDown", "description": "Internal pull-down resistor is selected"}, 
    //         "1": {"state": "kPORT_PullUp", "description": "Internal pull-up resistor is selected"}, 
    //         "offset": "0"},    //PS
    //0x0002: {"0": {"state": "kPORT_PullDisable", "description": "Internal pull up/down resistor is disabled"}, 
    //         "1": {"state": "kPORT_PullEnable", "description": "Internal pull up/down resistor is enabled"}, 
    //         "offset": "1"},    //PE
    0x0004: {
        "0": {
            "state": "kPORT_FastSlewRate",
            "description": "Fast slew rate is configured"
        },
        "1": {
            "state": "kPORT_SlowSlewRate",
            "description": "Slow slew rate is configured"
        },
        "offset": "2",
        "configure": "optional"
    }, //SRE
    0x0010: {
        "0": {
            "state": "kPORT_PassiveFilterDisable",
            "description": "Passive filter is disabled"
        },
        "1": {
            "state": "kPORT_PassiveFilterEnable",
            "description": "Passive filter is enabled"
        },
        "offset": "4",
        "configure": "optional"
    }, //PFE
    0x0020: {
        "0": {
            "state": "kPORT_OpenDrainDisable",
            "description": "Open drain is disabled"
        },
        "1": {
            "state": "kPORT_OpenDrainEnable",
            "description": "Open drain is enabled"
        },
        "offset": "5",
        "configure": "optional"
    }, //ODE
    0x0040: {
        "0": {
            "state": "kPORT_LowDriveStrength",
            "description": "Low drive strength is configured"
        },
        "1": {
            "state": "kPORT_HighDriveStrength",
            "description": "High drive strength is configured"
        },
        "offset": "6",
        "configure": "optional"
    }, //DSE
}
if (portMuxWidth == 3) {
    setPinConfigTable[0x0700] = {
        "0": {
            "state": "kPORT_PinDisabledOrAnalog",
            "description": ""
        },
        "1": {
            "state": "kPORT_MuxAsGpio",
            "description": ""
        },
        "2": {
            "state": "kPORT_MuxAlt2",
            "description": ""
        },
        "3": {
            "state": "kPORT_MuxAlt3",
            "description": ""
        },
        "4": {
            "state": "kPORT_MuxAlt4",
            "description": ""
        },
        "5": {
            "state": "kPORT_MuxAlt5",
            "description": ""
        },
        "6": {
            "state": "kPORT_MuxAlt6",
            "description": ""
        },
        "7": {
            "state": "kPORT_MuxAlt7",
            "description": ""
        },
        "offset": "8",
        "configure": "always"
    }; //3-bit MUX
} else {
    if (portMuxWidth == 4) {
        setPinConfigTable[0x0F00] = {
            "0": {
                "state": "kPORT_PinDisabledOrAnalog",
                "description": ""
            },
            "1": {
                "state": "kPORT_MuxAsGpio",
                "description": ""
            },
            "2": {
                "state": "kPORT_MuxAlt2",
                "description": ""
            },
            "3": {
                "state": "kPORT_MuxAlt3",
                "description": ""
            },
            "4": {
                "state": "kPORT_MuxAlt4",
                "description": ""
            },
            "5": {
                "state": "kPORT_MuxAlt5",
                "description": ""
            },
            "6": {
                "state": "kPORT_MuxAlt6",
                "description": ""
            },
            "7": {
                "state": "kPORT_MuxAlt7",
                "description": ""
            },
            "8": {
                "state": "kPORT_MuxAlt8",
                "description": ""
            },
            "9": {
                "state": "kPORT_MuxAlt9",
                "description": ""
            },
            "10": {
                "state": "kPORT_MuxAlt10",
                "description": ""
            },
            "11": {
                "state": "kPORT_MuxAlt11",
                "description": ""
            },
            "12": {
                "state": "kPORT_MuxAlt12",
                "description": ""
            },
            "13": {
                "state": "kPORT_MuxAlt13",
                "description": ""
            },
            "14": {
                "state": "kPORT_MuxAlt14",
                "description": ""
            },
            "15": {
                "state": "kPORT_MuxAlt15",
                "description": ""
            },
            "offset": "8",
            "configure": "always"
        }; //4-bit MUX
    } else {
        logMessage("Unsupported width " + portMuxWidth + " of " + pinMuxControlBitName + " bit field in " + pinMuxControlBitName + " register.", false);
    }
}
setPinConfigTable[0x8000] = {
    "0": {
        "state": "kPORT_UnlockRegister",
        "description": "Pin Control Register fields [15:0] are not locked"
    },
    "1": {
        "state": "kPORT_LockRegister",
        "description": "Pin Control Register fields [15:0] are locked"
    },
    "offset": "15",
    "configure": "optional"
}; //LK

setPinConfigTable[pinIrqcBitMask] = {
    "0" : {
        "state": "kPORT_InterruptOrDMADisabled",
        "description": "Interrupt/DMA request is disabled"
    },
    "1" : {
        "state": "kPORT_DMARisingEdge",
        "description": "DMA request on rising edge"
    },
    "2" : {
        "state": "kPORT_DMAFallingEdge",
        "description": "DMA request on falling edge"
    },
    "3" : {
        "state": "kPORT_DMAEitherEdge",
        "description": "DMA request on either edge"
    },
    "4" : {
        "state": "kPORT_InterruptOrDMADisabled",
        "description": "Interrupt/DMA request is disabled"
    },
    "5" : {
        "state": "kPORT_FlagRisingEdge",
        "description": "Flag sets on rising edge"
    },
    "6" : {
        "state": "kPORT_FlagFallingEdge",
        "description": "Flag sets on falling edge"
    },
    "7" : {
        "state": "kPORT_FlagEitherEdge",
        "description": "Flag sets on either edge"
    },
    "8" : {
        "state": "kPORT_InterruptLogicZero",
        "description": "Interrupt when logic zero"
    },
    "9" : {
        "state": "kPORT_InterruptRisingEdge",
        "description": "Interrupt on rising edge"
    },
    "10" : {
        "state": "kPORT_InterruptFallingEdge",
        "description": "Interrupt on falling edge"
    },
    "11" : {
        "state": "kPORT_InterruptEitherEdge",
        "description": "Interrupt on either edge"
    },
    "12" : {
        "state": "kPORT_InterruptLogicOne",
        "description": "Interrupt when logic one"
    },
    "13" : {
        "state": "kPORT_ActiveHighTriggerOutputEnable",
        "description": "Enable active high-trigger output"
    },
    "14" : {
        "state": "kPORT_ActiveLowTriggerOutputEnable",
        "description": "Enable active low-trigger output"
    },
    "offset": "16",
    "configure": "optional"
}  //IRQC


/**
 * Function returns formatted PORT_SetPinConfig(...); line with comment. 
 */
function pinConfigStructLine(codeLine, comment, structIndent) {
    return (makeComment(comment) + '\n' + makeString(' ', structIndent) + codeLine);
}

/**
 * Puts calling PORT_SetPinConfig including const data structure which defines pin functional properties and pin muxing into output 
 * accessRegs - reference to registers to be configured with theirs values
 * return no value; just prining into ouput
 */
function printPortSetPinConfig(accessRegs) {
    var accessRegister = accessRegs[0];
    var reg = accessRegister.register;
    var registerName = reg.registerName;
    var setValue = accessRegister.setValue;
    var gpioNameIndex = getPortInitialsStr(registerName);
    var coordinates = getSelectedPinCoordinatesStr(registerName, portMuxMask);
    var isNotBounded = isNotBoundedPin(coordinates);

    var localStructureName = getRoutedPinIdentifier(registerName);

    if (!(localStructureName)) {
        localStructureName = 'port' + gpioNameIndex.toLowerCase() + '_pin' + coordinates + '_config';
        if (isNotBounded) {
            localStructureName = 'port' + gpioNameIndex.toLowerCase() + '_nbpin_config';
        }
    };

    var lastMask;
    var firstMask;

    for (var mask in setPinConfigTable) {
        if (((setPinConfigTable[mask].configure == "always") || (getBitwiseAnd(globalPcrMask, mask) > 0)) && (mask != pinIrqcBitMask)) {
            lastMask = mask;
        }
    }
    for (var mask in setPinConfigTable) {
        if (((setPinConfigTable[mask].configure == "always") || (getBitwiseAnd(globalPcrMask, mask) > 0)) && (mask != pinIrqcBitMask)){
            firstMask = mask;
            break;
        }
    }
    var comment = "";
    var pinDisabled = isPinDisabled(registerName, portMuxMask);
    var destinationComment = 'configured as ' + getSelectedPinNamePartStr(registerName, portMuxMask);
    if (pinDisabled) {
        destinationComment = "disabled";
    };
    var pinCoordinateComment = '(pin ' + coordinates + ') ';
    if (isNotBounded) {
        pinCoordinateComment = '(n/b pin) ';
    };
    for (var mask in setPinConfigTable) {
        var configTableMask = setPinConfigTable[mask];
        if (((configTableMask.configure == "always") || (getBitwiseAnd(globalPcrMask, mask) > 0)) && (mask != pinIrqcBitMask)) {
            var configTableMaskValue = configTableMask[(getBitwiseAnd(setValue, mask) >>> configTableMask.offset)];
            var codeLine = configTableMaskValue.state;
            if (mask != lastMask) {
                codeLine += ",";
            }
            if (mask != pinMuxControlBitMask) {
                var comment = configTableMaskValue.description;
            } else {
                comment = "Pin is " + destinationComment;
            }
            // This code overrides comment for the structure item which is corresponding to unsupported electrical feature and also informs on console
            //if ((configTableMask.configure == "always") && (getBitwiseAnd(globalPcrMask, mask) == 0)) {
            //  comment = "This setting won't affect the pin.";
            //  if (testMode) {
            //    logMessage("There is not bit-field 0x" + getBitwiseOr(mask,0).toString(16) + " in " + registerName + " register in order to configure " + configTableMaskValue.state, false);
            //  }
            //}
            var structIndent = (cIndent4 + 'const port_pin_config_t ' + localStructureName + ' = {').length;
            PExOut_gen(((mask == firstMask) ? ('\n' + cIndent4 + 'const port_pin_config_t ' + localStructureName + ' = {') : makeString(' ', structIndent)) +
                pinConfigStructLine(codeLine, comment, structIndent) +
                ((mask == lastMask) ? "};" : ""));
        }
    }
    comment = 'PORT' + gpioNameIndex + ' ' + pinCoordinateComment + 'is ' + destinationComment;
    if (getRoutedPinPort(registerName) && getRoutedPinPin(registerName) && (getRoutedPinIdentifier(registerName))) {
        PExOut_gen(cIndent4 + makeComment(comment) + '\n' + cIndent4 + 'PORT_SetPinConfig(' + getRoutedPinPort(registerName) + ', ' + getRoutedPinPin(registerName) + ', &' + getRoutedPinIdentifier(registerName) + ');');
    } else {
        PExOut_gen(cIndent4 + makeComment(comment) + '\n' + cIndent4 + 'PORT_SetPinConfig(PORT' + getPortInitialStr(registerName) + ', ' + getPortIndexStr(registerName) + 'U, &' + localStructureName + ');');
    }
    reg.writeFunctions = null;
}


/**
 * Registers using SDK function PORT_SetPinConfig 
 * reg - register defined by name, clr mask and set mask
 * writeFunctions - reference to writeFunctions array (collection of data for SDK write functions) 
 * configurationConstantDefinitionList - given configuration where constant definitions are added
 * return no value
 */
function enrolPortSetPinConfig(reg, writeFunctions, configurationConstantDefinitionList, pc) {
    var registerName = reg.registerName;
    var dbRegister = registerDatabaseObject.getRegisterByFullName(reg.registerName);
    var nonReadOnlyMask = getNonReadOnlyMask(dbRegister);
    var configurableMask = getBitwiseAnd(getBitwiseAnd(0x7FFF, dbRegister.getNonReservedMask()), nonReadOnlyMask);
    var writeFunc = new Object();
    if (registerName.indexOf(portControlRegisterName) >= 0) {
        var setValMask = getBitwiseAnd(getBitwiseOr(reg.registerClrMask, reg.registerSetMask), configurableMask);
        if (getBitwiseXor(setValMask, configurableMask) == 0) {
            var setValue = getBitwiseOr((getBitwiseAnd(reg.registerSetMask, setValMask)), (getBitwiseAnd(getResetValue(dbRegister), getBitwiseXor(nonReadOnlyMask, dbRegister.getMask().doubleValue()))));
            for (var mask in setPinConfigTable) {
                var configTableMask = setPinConfigTable[mask];
                if ((configTableMask.reserved == null) && (getBitwiseAnd(globalPcrMask, mask) > 0)) {
                    var configTableMaskValue = configTableMask[(getBitwiseAnd(setValue, mask) >>> configTableMask.offset)];
                    if (configTableMaskValue.state == 'notSupported') {
                        return;
                    }
                }
            }
            var defValue = getPortIndexStr(registerName);
            // registerConstantDefinition('PIN' + normalizeNumberStr(defValue) + '_IDX', 'PIN' + defValue + '_IDX', defValue, 'Pin number for pin ' + defValue + ' in a port', 'index', configurationConstantDefinitionList);
            writeFunc.printFunction = printPortSetPinConfig;
            writeFunc.accessRegisters = new Array();
            var accessRegister = new Object();
            accessRegister.register = reg;
            accessRegister.setValue = setValue;
            accessRegister.configurableMask = configurableMask;
            writeFunc.accessRegisters.push(accessRegister);
            var writeFunctionsIndex = writeFunctions.push(writeFunc) - 1;
            reg.registerClrMask = 0;
            reg.registerSetMask = 0;
            if (reg.writeFunctions == null) {
                reg.writeFunctions = new Array();
            }
            reg.writeFunctions.push(writeFunctions[writeFunctionsIndex]);
            include_fsl_port['present'] = true;
            include_fsl_port['pcs'].push(pc);
        }
    }
}

/**
 * Function gets user defined identifier of pin routed in currently handled configuration (currentComponent)
 */
function getRoutedPinIdentifier(registerName) {
    var pin_listProperty = allComponents[!testMode ? currentComponent : 0].findItemBySymbol("pin_list");
    var numOfItems = pin_listProperty.getItemsCount();

    for (var i = 0; i < numOfItems; i++) {
        var coordinates = getSelectedPinCoordinatesStr(registerName, portMuxMask);
        var pinRoutings = routedPinsDB[coordinates];
        for (var routedPin in pinRoutings) {
            if ((pinRoutings[routedPin].configuration == currentComponent) && (pinRoutings[routedPin].item == i)) {
                var identifierBody = pinRoutings[routedPin].prefix + pinRoutings[routedPin].ipIdentifier;
                if (pinRoutings[routedPin].port != null) {
                    return (pinRoutings[routedPin].identifier);
                }
            }
        }
    }
}

/**
 * Function gets PORT constant defined for pin routed in currently handled configuration (currentComponent)
 */
function getRoutedPinPort(registerName) {
    var pin_listProperty = allComponents[!testMode ? currentComponent : 0].findItemBySymbol("pin_list");
    var numOfItems = pin_listProperty.getItemsCount();

    for (var i = 0; i < numOfItems; i++) {
        var coordinates = getSelectedPinCoordinatesStr(registerName, portMuxMask);
        var pinRoutings = routedPinsDB[coordinates];
        for (var routedPin in pinRoutings) {
            if ((pinRoutings[routedPin].configuration == currentComponent) && (pinRoutings[routedPin].item == i)) {
                var identifierBody = pinRoutings[routedPin].prefix + pinRoutings[routedPin].ipIdentifier;
                if (pinRoutings[routedPin].port != null) {
                    return (identifierBody + ((pinRoutings[routedPin].ipIdentifier == '') ? '' : '_') + pinRoutings[routedPin].identifier + "_PORT");
                }
            }
        }
    }
}

/**
 * Function gets GPIO constant defined for pin routed in currently handled configuration (currentComponent)
 */
function getRoutedPinGpio(registerName) {
    var pin_listProperty = allComponents[!testMode ? currentComponent : 0].findItemBySymbol("pin_list");
    var numOfItems = pin_listProperty.getItemsCount();

    for (var i = 0; i < numOfItems; i++) {
        var coordinates = getSelectedPinCoordinatesStr(registerName, portMuxMask);
        var pinRoutings = routedPinsDB[coordinates];
        for (var routedPin in pinRoutings) {
            if ((pinRoutings[routedPin].configuration == currentComponent) && (pinRoutings[routedPin].item == i)) {
                var identifierBody = pinRoutings[routedPin].prefix + pinRoutings[routedPin].ipIdentifier;
                if (pinRoutings[routedPin].port != null) {
                    return (identifierBody + ((pinRoutings[routedPin].ipIdentifier == '') ? '' : '_') + pinRoutings[routedPin].identifier + "_GPIO");
                }
            }
        }
    }
}

/**
 * Function gets PIN constant defined for pin routed in currently handled configuration (currentComponent)
 */
function getRoutedPinPin(registerName) {
    var pin_listProperty = allComponents[!testMode ? currentComponent : 0].findItemBySymbol("pin_list");
    var numOfItems = pin_listProperty.getItemsCount();

    for (var i = 0; i < numOfItems; i++) {
        var coordinates = getSelectedPinCoordinatesStr(registerName, portMuxMask);
        var pinRoutings = routedPinsDB[coordinates];
        for (var routedPin in pinRoutings) {
            if ((pinRoutings[routedPin].configuration == currentComponent) && (pinRoutings[routedPin].item == i)) {
                var identifierBody = pinRoutings[routedPin].prefix + pinRoutings[routedPin].ipIdentifier;
                if (pinRoutings[routedPin].port != null) {
                    return (identifierBody + ((pinRoutings[routedPin].ipIdentifier == '') ? '' : '_') + pinRoutings[routedPin].identifier + "_PIN");
                }
            }
        }
    }
}

/**
 * Puts calling PORT_SetPinMux into output 
 * accessRegs - reference to registers to be configured with values
 * return no value; just prining into ouput
 */
function printPortSetPinMux(accessRegs) {
    var accessRegister = accessRegs[0];
    var reg = accessRegister.register;
    var registerName = reg.registerName;
    var gpioNameIndex = getPortInitialsStr(registerName);
    var coordinates = getSelectedPinCoordinatesStr(registerName, portMuxMask);
    var configTableMask = setPinConfigTable[pinMuxControlBitMask];
    var configTableMaskValueState = configTableMask[(getBitwiseAnd(accessRegister.setValue, pinMuxControlBitMask) >>> configTableMask.offset)].state;
    var comment = 'PORT' + gpioNameIndex + ' ';
    if (isNotBoundedPin(coordinates)) {
        comment += '(n/b pin) ';
    } else {
        comment += '(pin ' + coordinates + ') ';
    };
    comment += 'is ';
    if (isPinDisabled(registerName, portMuxMask)) {
        comment += 'disabled';
    } else {
        comment += 'configured as ' + getSelectedPinNamePartStr(registerName, portMuxMask);
    };

    PExOut_gen('');
    if (getRoutedPinPort(registerName) && getRoutedPinPin(registerName)) {
        PExOut_gen(cIndent4 + makeComment(comment) + '\n' + cIndent4 + 'PORT_SetPinMux(' + getRoutedPinPort(registerName) + ', ' + getRoutedPinPin(registerName) + ', ' + configTableMaskValueState + ');');
    } else {
        PExOut_gen(cIndent4 + makeComment(comment) + '\n' + cIndent4 + 'PORT_SetPinMux(PORT' + getPortInitialStr(registerName) + ', ' + getPortIndexStr(registerName) + 'U, ' + configTableMaskValueState + ');');
    }
    reg.writeFunctions = null;
}


/**
 * Registers using SDK function PORT_SetPinMux 
 * reg - register defined by name, clr mask and set mask
 * writeFunctions - reference to writeFunctions array (collection of data for SDK write functions) 
 * configurationConstantDefinitionList - given configuration where constant definitions are added
 * return no value
 */
function enrolPortSetPinMux(reg, writeFunctions, configurationConstantDefinitionList, pc) {
    var registerName = reg.registerName;
    var dbRegister = registerDatabaseObject.getRegisterByFullName(reg.registerName);
    var configurableMask = pinMuxControlBitMask;
    var writeFunc = new Object();
    if (registerName.indexOf(portControlRegisterName) >= 0) {
        var setValMask = getBitwiseAnd(getBitwiseOr(reg.registerClrMask, reg.registerSetMask), configurableMask);
        if (getBitwiseXor(setValMask, configurableMask) == 0) {
            var defValue = getPortIndexStr(registerName);
            // registerConstantDefinition('PIN' + normalizeNumberStr(defValue) + '_IDX', 'PIN' + defValue + '_IDX', defValue, 'Pin number for pin ' + defValue + ' in a port', 'index', configurationConstantDefinitionList);
            writeFunc.printFunction = printPortSetPinMux;
            writeFunc.accessRegisters = new Array();
            var accessRegister = new Object();
            accessRegister.register = reg;
            accessRegister.setValue = getBitwiseAnd(reg.registerSetMask, setValMask);
            accessRegister.configurableMask = configurableMask;
            writeFunc.accessRegisters.push(accessRegister);
            var writeFunctionsIndex = writeFunctions.push(writeFunc) - 1;
            reg.registerClrMask = getBitwiseAnd(reg.registerClrMask, getBitwiseNeg32(pinMuxControlBitMask));
            reg.registerSetMask = getBitwiseAnd(reg.registerSetMask, getBitwiseNeg32(pinMuxControlBitMask));
            if (reg.writeFunctions == null) {
                reg.writeFunctions = new Array();
            }
            reg.writeFunctions.push(writeFunctions[writeFunctionsIndex]);
            include_fsl_port['present'] = true;
            include_fsl_port['pcs'].push(pc);
        }
    }
}


function indexesOf(str, c) {
    var strLength = str.length;
    for(var indexes = [], i = 0; strLength > i; i++) {
        c === str[i] && indexes.push(i);
    }
    return indexes;
}

/**
 * Registers using SDK function PORT_SetPinMux 
 * reg - register defined by name, clr mask and set mask
 * writeFunctions - reference to writeFunctions array (collection of data for SDK write functions) 
 * configurationConstantDefinitionList - given configuration where constant definitions are added
 * return no value
 */
function enrolGpioPinInit(reg, writeFunctions, configurationConstantDefinitionList, pc) {
    var registerName = reg.registerName;
    var dbRegister = registerDatabaseObject.getRegisterByFullName(reg.registerName);
    var nonReadOnlyMask = getNonReadOnlyMask(dbRegister);
    var configurableMask = getBitwiseAnd(getBitwiseAnd(0xFFFFFFFF, dbRegister.getNonReservedMask()), nonReadOnlyMask);
    var setValMask = getBitwiseAnd(getBitwiseOr(reg.registerClrMask, reg.registerSetMask), configurableMask);

    var setValMaskStr = parseInt(setValMask, 10).toString(2);
    var registerClrMaskStr = parseInt(reg.registerClrMask, 10).toString(2).split('').reverse().join('');
    var registerSetMaskStr = parseInt(reg.registerSetMask, 10).toString(2).split('').reverse().join('');
    var setValue = getBitwiseOr((getBitwiseAnd(reg.registerSetMask, setValMask)), (getBitwiseAnd(getResetValue(dbRegister), getBitwiseXor(nonReadOnlyMask, dbRegister.getMask().doubleValue()))));

    var writeFunc = new Object();
    if (registerName.indexOf(gpioDirectionRegisterName) >= 0) {
        var gpioIdx = getGpioIndexStr(registerName);
        if (gpioSignalConfiguration[pc] == null) {
            gpioSignalConfiguration[pc] = {};
        }
        
        if (gpioSignalConfiguration[pc][gpioIdx] == null) {
            gpioSignalConfiguration[pc][gpioIdx] = {};
        }

        writeFunc.printFunction = printGpioPinInit;
        writeFunc.accessRegisters = new Array();
        var affectedPins = indexesOf(setValMaskStr.split('').reverse().join(''), '1');
        
        if (gpioSignalConfiguration[pc][gpioIdx].pins == null) {
            gpioSignalConfiguration[pc][gpioIdx].pins = affectedPins;
        }

        if (gpioSignalConfiguration[pc][gpioIdx].directions == null) {
            gpioSignalConfiguration[pc][gpioIdx].directions = new Array();
        }

        if (gpioSignalConfiguration[pc][gpioIdx].states == null) {
            var pdorReg = registerDatabaseObject.getRegisterByFullName(reg.registerName.replace(gpioDirectionRegisterName, 'PDOR'));
            var pdoField = pdorReg.findBitFieldByName("PDO");
            var pdoWidth = pdoField.getWidth();
            var resetValue = pdoField.getResetValue().longValue();
            var resetValueArr = parseInt(resetValue, 10).toString(2).split('').reverse();

            gpioSignalConfiguration[pc][gpioIdx].states = new Array(pdoWidth + 1).join('0').split('');
            for (var i = 0; i < resetValueArr.length; i++) {
                gpioSignalConfiguration[pc][gpioIdx].states[i] = resetValueArr[i];
            }
        }

        for (var i = 0; i < affectedPins.length; i++) {
            if (registerClrMaskStr[affectedPins[i]] == '1') {
                gpioSignalConfiguration[pc][gpioIdx].directions.push('kGPIO_DigitalInput');
            }
            if (registerSetMaskStr[affectedPins[i]] == '1') {
                gpioSignalConfiguration[pc][gpioIdx].directions.push('kGPIO_DigitalOutput');
            }
            //gpioSignalConfiguration[pc].gpios.push(gpioIdx);
        }

        var accessRegister = new Object();
        accessRegister.register = reg;
        accessRegister.affectedPins = affectedPins;
        accessRegister.configurableMask = configurableMask;
        writeFunc.accessRegisters.push(accessRegister);
        var writeFunctionsIndex = writeFunctions.push(writeFunc) - 1;
        reg.registerClrMask = 0;
        reg.registerSetMask = 0;
        if (reg.writeFunctions == null) {
            reg.writeFunctions = new Array();
        }
        reg.writeFunctions.push(writeFunctions[writeFunctionsIndex]);
        include_fsl_gpio['present'] = true;
        include_fsl_gpio['pcs'].push(pc);
    }

    if ((registerName.indexOf('PSOR') >= 0) || (registerName.indexOf('PCOR') >= 0)) {
        if (registerName.indexOf('PSOR') >= 0) {
            var pinValue = '1';
        } 
        if (registerName.indexOf('PCOR') >= 0) {
            var pinValue = '0';
        }

        var gpioIdx = getGpioIndexStr(registerName);
        if (gpioSignalConfiguration[pc] == null) {
            gpioSignalConfiguration[pc] = new Object();
        }
        if (gpioSignalConfiguration[pc][gpioIdx] == null) {
            gpioSignalConfiguration[pc][gpioIdx] = {};
        }

        if (gpioSignalConfiguration[pc][gpioIdx].states == null) {
            var pdorReg = registerDatabaseObject.getRegisterByFullName(reg.registerName.replace('PCOR', 'PDOR').replace('PSOR', 'PDOR'));
            var pdoField = pdorReg.findBitFieldByName("PDO");
            var pdoWidth = pdoField.getWidth();
            var resetValue = pdoField.getResetValue().longValue();
            var resetValueArr = parseInt(resetValue, 10).toString(2).split('').reverse();
            gpioSignalConfiguration[pc][gpioIdx].states = new Array(pdoWidth + 1).join('0').split('');
            for (var i = 0; i < resetValueArr.length; i++) {
                gpioSignalConfiguration[pc][gpioIdx].states[i] = resetValueArr[i];
            }
        }

        var affectedPins = indexesOf(setValMaskStr.split('').reverse().join(''), '1');

        for (var i = 0; i < affectedPins.length; i++) {
            gpioSignalConfiguration[pc][gpioIdx].states[affectedPins[i]] = pinValue;
        }

        reg.registerClrMask = 0;
        reg.registerSetMask = 0;
        reg.writeFunctions = null;        
    }
}


/**
 * Puts calling PORT_EnablePinsDigitalFilter(,,true) into output 
 * accessRegs - reference to registers to be configured with values
 * return no value; just prining into ouput
 */
function printPortEnablePinsDigitalFilter(accessRegs) {
    var accessRegister = accessRegs[0];
    var reg = accessRegister.register;
    var registerName = reg.registerName;
    var constants = new Array();
    for (var i = 0; i < 32; i++) {
        if (getBitwiseAnd(getBitwiseShiftLeft(1, i), accessRegister.setMask) > 0) {
            constants.push(accessRegister.bitFieldArrayXMask.replace('x', i));
        }
    }
    PExOut_gen(cIndent4 + makeComment('Configure digital filter') + '\n' + cIndent4 + 'PORT_EnablePinsDigitalFilter(');
    var port = 'PORT' + getPortInitialStr(registerName);
    PExOut_gen(cIndent8 + makeComment('Digital filter is configured on port ' + getPortInitialStr(registerName)) + '\n' + cIndent8 + port + ',');
    for (var i = 0; i < constants.length; i++) {
        PExOut_gen(cIndent8 + ((i > 0) ? cIndent4 : "") + makeComment('Digital filter is configured for ' + port + i) + '\n' + cIndent8 + ((i > 0) ? cIndent4 : "") + getBitFieldArrayOrMaskItem(constants, i, ','));
    }
    PExOut_gen(cIndent8 + makeComment('Enable digital filter') + '\n' + cIndent8 + 'true);');
    reg.writeFunctions = null;
}

function printGpioPinInit(pc) {
    if (gpioSignalConfiguration[pc] != null) {
        Object.keys(gpioSignalConfiguration[pc]).forEach(function(gpioNameIndex) {
            for (var i = 0; i < gpioSignalConfiguration[pc][gpioNameIndex].pins.length; i++) {
                PExOut_gen('');
                var registerName = 'PORT' + gpioNameIndex + '_PCR' + gpioSignalConfiguration[pc][gpioNameIndex].pins[i];
                var coordinates = getSelectedPinCoordinatesStr(registerName, portMuxMask);
                // var configTableMask = gpioPinInitTable[gpioPddMask];
                var isNotBounded = isNotBoundedPin(coordinates);
                //var configTableMaskValueState = configTableMask[(getBitwiseAnd(accessRegister.setValue, gpioPddMask) >>> configTableMask.offset)].state;
                var localStructureName = getRoutedPinIdentifier(registerName);

                if (!(localStructureName)) {
                    localStructureName = 'gpio' + gpioNameIndex.toLowerCase() + '_pin' + coordinates + '_config';
                    if (isNotBounded) {
                        localStructureName = 'gpio' + gpioNameIndex.toLowerCase() + '_nbpin_config';
                    }
                } else {
                    localStructureName += "_config";
                }
                PExOut_gen('    gpio_pin_config_t ' + localStructureName + ' = {');
                PExOut_gen('        .pinDirection = ' + gpioSignalConfiguration[pc][gpioNameIndex].directions[i] + ',');
                PExOut_gen('        .outputLogic = ' + gpioSignalConfiguration[pc][gpioNameIndex].states[gpioSignalConfiguration[pc][gpioNameIndex].pins[i]] + 'U');
                PExOut_gen('    };');

                var comment = 'Initialize GPIO functionality on pin PT' + gpioNameIndex + gpioSignalConfiguration[pc][gpioNameIndex].pins[i] + ' ';
                if (isNotBounded) {
                    comment += '(n/b pin) ';
                } else {
                    comment += '(pin ' + coordinates + ') ';
                };

                if (getRoutedPinGpio(registerName) && getRoutedPinPin(registerName)) {
                    PExOut_gen(cIndent4 + makeComment(comment) + '\n' + cIndent4 + 'GPIO_PinInit(' + getRoutedPinGpio(registerName) + ', ' + getRoutedPinPin(registerName) + ', &' + localStructureName + ');');
                } else {
                    PExOut_gen(cIndent4 + makeComment(comment) + '\n' + cIndent4 + 'GPIO_PinInit(GPIO' + gpioNameIndex + ', ' + gpioSignalConfiguration[pc][gpioNameIndex].pins[i] + 'U, &' + localStructureName + ');');
                }
            }
        });
    }
}

function enrolPortSetPinInterruptConfig(reg, writeFunctions, configurationConstantDefinitionList, pc) {
    var registerName = reg.registerName;
    var dbRegister = registerDatabaseObject.getRegisterByFullName(reg.registerName);
    var configurableMask = pinIrqcBitMask;
    var writeFunc = new Object();
    if (registerName.indexOf(portControlRegisterName) >= 0) {
        var setValMask = getBitwiseAnd(getBitwiseOr(reg.registerClrMask, reg.registerSetMask), configurableMask);
        if (getBitwiseXor(setValMask, configurableMask) == 0) {
            var defValue = getPortIndexStr(registerName);
            // registerConstantDefinition('PIN' + normalizeNumberStr(defValue) + '_IDX', 'PIN' + defValue + '_IDX', defValue, 'Pin number for pin ' + defValue + ' in a port', 'index', configurationConstantDefinitionList);
            writeFunc.printFunction = printPortSetPinInterruptConfig;
            writeFunc.accessRegisters = new Array();
            var accessRegister = new Object();
            accessRegister.register = reg;
            accessRegister.setValue = getBitwiseAnd(reg.registerSetMask, setValMask);
            accessRegister.configurableMask = configurableMask;
            writeFunc.accessRegisters.push(accessRegister);
            var writeFunctionsIndex = writeFunctions.push(writeFunc) - 1;
            reg.registerClrMask = getBitwiseAnd(reg.registerClrMask, getBitwiseNeg32(pinIrqcBitMask));
            reg.registerSetMask = getBitwiseAnd(reg.registerSetMask, getBitwiseNeg32(pinIrqcBitMask));
            if (reg.writeFunctions == null) {
                reg.writeFunctions = new Array();
            }
            reg.writeFunctions.push(writeFunctions[writeFunctionsIndex]);
            include_fsl_port['present'] = true;
            include_fsl_port['pcs'].push(pc);
        }
    }
}

function printPortSetPinInterruptConfig(accessRegs) {
    var accessRegister = accessRegs[0];
    var reg = accessRegister.register;
    var registerName = reg.registerName;
    var gpioNameIndex = getPortInitialsStr(registerName);
    var coordinates = getSelectedPinCoordinatesStr(registerName, portMuxMask);
    var configTableMask = setPinConfigTable[pinIrqcBitMask];
    var configTableMaskValueState = configTableMask[(getBitwiseAnd(accessRegister.setValue, pinIrqcBitMask) >>> configTableMask.offset)].state;
    var comment = 'Interrupt configuration on PORT' + gpioNameIndex;
    if (isNotBoundedPin(coordinates)) {
        comment += ' (n/b pin) ';
    } else {
        comment += ' (pin ' + coordinates + '): ';
    };
    if (isPinDisabled(registerName, portMuxMask)) {
        comment += 'disabled';
    } else {
        comment += configTableMask[(getBitwiseAnd(accessRegister.setValue, pinIrqcBitMask) >>> configTableMask.offset)].description;
    };

    PExOut_gen('');
    if (getRoutedPinPort(registerName) && getRoutedPinPin(registerName)) {
        PExOut_gen(cIndent4 + makeComment(comment) + '\n' + cIndent4 + 'PORT_SetPinInterruptConfig(' + getRoutedPinPort(registerName) + ', ' + getRoutedPinPin(registerName) + ', ' + configTableMaskValueState + ');');
    } else {
        PExOut_gen(cIndent4 + makeComment(comment) + '\n' + cIndent4 + 'PORT_SetPinInterruptConfig(PORT' + getPortInitialStr(registerName) + ', ' + getPortIndexStr(registerName) + 'U, ' + configTableMaskValueState + ');');
    }
    reg.writeFunctions = null;
}

/**
 * Registers using SDK function PORT_EnablePinsDigitalFilter(,,true) 
 * reg - register defined by name, clr mask and set mask
 * writeFunctions - reference to writeFunctions array (collection of data for SDK write functions) 
 * configurationConstantDefinitionList - given configuration where constant definitions are added
 * return no value
 */
function enrolPortEnablePinsDigitalFilter(reg, writeFunctions, configurationConstantDefinitionList, pc) {
    var registerName = reg.registerName;
    var dbRegister = registerDatabaseObject.getRegisterByFullName(reg.registerName);
    //var configurableMask = pinMuxControlBitMask;
    var writeFunc = new Object();
    if (registerName.indexOf(digitalFilterEnableRegisterName) >= 0) {
        var setValMask = reg.registerSetMask;
        if (setValMask > 0) {
            writeFunc.printFunction = printPortEnablePinsDigitalFilter;
            writeFunc.accessRegisters = new Array();
            var accessRegister = new Object();
            accessRegister.register = reg;
            accessRegister.setMask = setValMask;
            accessRegister.bitFieldArrayXMask = processRegister(reg, "onlyMaskConstantDefinitions", configurationConstantDefinitionList); // Prepare constants for both clrMask (PORT_EnablePinsDigitalFilter(,,false)) and setMask (PORT_EnablePinsDigitalFilter(,,true)) because of having nice order *_0_MASK, *_1_MASK, *_2_MASK,...
            writeFunc.accessRegisters.push(accessRegister);
            var writeFunctionsIndex = writeFunctions.push(writeFunc) - 1;
            reg.registerSetMask = 0;
            if (reg.writeFunctions == null) {
                reg.writeFunctions = new Array();
            }
            reg.writeFunctions.push(writeFunctions[writeFunctionsIndex]);
            include_fsl_port['present'] = true;
            include_fsl_port['pcs'].push(pc);
        }
    }
}


/**
 * Puts calling PORT_EnablePinsDigitalFilter(,,false) into output 
 * accessRegs - reference to registers to be configured with values
 * return no value; just printing into output
 */
function printPortDisablePinsDigitalFilter(accessRegs) {
    var accessRegister = accessRegs[0];
    var reg = accessRegister.register;
    var registerName = reg.registerName;
    var constants = new Array();
    for (var i = 0; i < 32; i++) {
        if (getBitwiseAnd(getBitwiseShiftLeft(1, i), accessRegister.clrMask) > 0) {
            constants.push(accessRegister.bitFieldArrayXMask.replace('x', i));
        }
    }
    PExOut_gen(cIndent4 + makeComment('Configure digital filter') + '\n' + cIndent4 + 'PORT_EnablePinsDigitalFilter(');
    var port = 'PORT' + getPortInitialStr(registerName);
    PExOut_gen(cIndent8 + makeComment('Digital filter is configured on port ' + getPortInitialStr(registerName)) + '\n' + cIndent8 + port + ',');
    for (var i = 0; i < constants.length; i++) {
        PExOut_gen(cIndent8 + ((i > 0) ? cIndent4 : "") + makeComment('Digital filter is configured for ' + port + i) + '\n' + cIndent8 + ((i > 0) ? cIndent4 : "") + getBitFieldArrayOrMaskItem(constants, i, ','));
    }
    PExOut_gen(cIndent8 + makeComment('Disable digital filter') + '\n' + cIndent8 + 'false);');
    reg.writeFunctions = null;
}


/**
 * Registers using SDK function PORT_EnablePinsDigitalFilter(,,false)  
 * reg - register defined by name, clr mask and set mask
 * writeFunctions - reference to writeFunctions array (collection of data for SDK write functions)
 * configurationConstantDefinitionList - given configuration where constant definitions are added
 * return no value
 */
function enrolPortDisablePinsDigitalFilter(reg, writeFunctions, configurationConstantDefinitionList, pc) {
    var registerName = reg.registerName;
    var dbRegister = registerDatabaseObject.getRegisterByFullName(reg.registerName);
    //var configurableMask = pinMuxControlBitMask;
    var writeFunc = new Object();
    if (registerName.indexOf(digitalFilterEnableRegisterName) >= 0) {
        var clrValMask = reg.registerClrMask;
        if (clrValMask > 0) {
            writeFunc.printFunction = printPortDisablePinsDigitalFilter;
            writeFunc.accessRegisters = new Array();
            var accessRegister = new Object();
            accessRegister.register = reg;
            accessRegister.clrMask = clrValMask;
            accessRegister.bitFieldArrayXMask = processRegister(reg, "onlyMaskConstantDefinitions", configurationConstantDefinitionList); // Prepare constants for both clrMask (PORT_EnablePinsDigitalFilter(,,false)) and setMask (PORT_EnablePinsDigitalFilter(,,true)) because of having nice order *_0_MASK, *_1_MASK, *_2_MASK,...
            writeFunc.accessRegisters.push(accessRegister);
            var writeFunctionsIndex = writeFunctions.push(writeFunc) - 1;
            reg.registerClrMask = 0;
            if (reg.writeFunctions == null) {
                reg.writeFunctions = new Array();
            }
            reg.writeFunctions.push(writeFunctions[writeFunctionsIndex]);
            include_fsl_port['present'] = true;
            include_fsl_port['pcs'].push(pc);
        }
    }
}

/**
 * Puts calling XBAR_SetSignalsConnection  
 * accessRegs - reference to registers to be configured with theirs values
 * return no value; just prining into ouput
 */
function printXbarSetSignalsConnection(accessRegs) {
    var accessRegister = accessRegs[0];
    var reg = accessRegister.register;
    var registerName = reg.registerName;
    var dbPeripheralName = registerDatabaseObject.getPeripheralByFullName(registerName).getName();
    var dbRegister = registerDatabaseObject.getRegisterByFullName(reg.registerName);
    var registerClrSetMask = getBitwiseOr(accessRegister.clrMask, accessRegister.setMask);
    var dbBitFields = dbRegister.getBitFields();
    var orValue = '0x100';
    if (xbarModulesAB) {
        if (dbPeripheralName == 'XBARB') {
            var xbarModulePrefix = 'XBARB';
        } else {
            var xbarModulePrefix = 'XBARA';
        }
    } else {
        var xbarModulePrefix = 'XBAR';
    }
    if (dbPeripheralName == 'XBARB') {
        orValue = '0x200';
    }
    for (var fi = 0; fi < dbBitFields.length; fi++) {
        var bitFieldMask = dbBitFields[fi].getRegisterMask().doubleValue();
        if (getBitwiseAnd(bitFieldMask, registerClrSetMask) > 0) {
            var bitFieldName = dbBitFields[fi].getName();
            var bitFieldValueX = getBitwiseAnd(accessRegister.setMask, bitFieldMask) >>> dbBitFields[fi].getOffset();
            var input = xbarInputSignal[dbPeripheralName][(bitFieldValueX + '|' + orValue).valueOf()];
            var otuputIndex = bitFieldName.substring(bitFieldName.indexOf(xbarSelRegisterName) + xbarSelRegisterName.length);
            var output = xbarOutputSignal[dbPeripheralName][(otuputIndex + '|' + orValue).valueOf()];
            if (input != null && output != null) {
                PExOut_gen(cIndent4 + makeComment(removeLastDotFromDescription(input[0].description) + ' is connected\n' + cIndent4 + ' * to ' + removeLastDotFromDescription(output[0].description)));
                PExOut_gen(cIndent4 + xbarModulePrefix + '_SetSignalsConnection(' + dbPeripheralName + ', ' + input[0].id + ', ' + output[0].id + ');');
            } else {
                logMessage("Unexpected status during SDK function XBAR_SetSignalsConnection printing.", false);
            }
        }
    }
    reg.writeFunctions = null;
}


/**
 * Registers using SDK function XBAR_SetSignalsConnection 
 * reg - register defined by name, clr mask and set mask
 * writeFunctions - reference to writeFunctions array (collection of data for SDK write functions) 
 * return no value
 */
function enrolXbarSetSignalsConnection(reg, writeFunctions, pc) {
    var registerName = reg.registerName;
    var dbRegister = registerDatabaseObject.getRegisterByFullName(reg.registerName);
    if (xbarInputSignal != null && xbarOutputSignal != null && registerName.indexOf(xbarPeripheralName) >= 0 && registerName.indexOf(xbarSelRegisterName) >= 0) {
        var writeFunc = new Object();
        writeFunc.printFunction = printXbarSetSignalsConnection;
        writeFunc.accessRegisters = new Array();
        var accessRegister = new Object();
        accessRegister.register = reg;
        accessRegister.clrMask = reg.registerClrMask;
        accessRegister.setMask = reg.registerSetMask;
        writeFunc.accessRegisters.push(accessRegister);
        var writeFunctionsIndex = writeFunctions.push(writeFunc) - 1;
        reg.registerClrMask = 0;
        reg.registerSetMask = 0;
        if (reg.writeFunctions == null) {
            reg.writeFunctions = new Array();
        }
        reg.writeFunctions.push(writeFunctions[writeFunctionsIndex]);
        if (xbarModulesAB) {
            if (registerName.indexOf(xbarPeripheralName + 'A') >= 0) {
                include_fsl_xbara['present'] = true;
                include_fsl_xbara['pcs'].push(pc);
            } else {
                include_fsl_xbarb['present'] = true;
                include_fsl_xbarb['pcs'].push(pc);
            }
        } else {
            include_fsl_xbar['present'] = true;
            include_fsl_xbar['pcs'].push(pc);
        }
    }
}


var xbarActiveEdgeTable = {
    "0": {
        "state": "_EdgeNone",
        "description": "Edge detection status bit never asserts"
    },
    "1": {
        "state": "_EdgeRising",
        "description": "Edge detection status bit asserts on rising edges"
    },
    "2": {
        "state": "_EdgeFalling",
        "description": "Edge detection status bit asserts on falling edges"
    },
    "3": {
        "state": "_EdgeRisingAndFalling",
        "description": "Edge detection status bit asserts on rising and falling edges"
    },
}
var xbarRequestTypeTable = {
    "0": {
        "state": "_RequestDisable",
        "description": "Interrupt and DMA are disabled"
    },
    "1": {
        "state": "_RequestDMAEnable",
        "description": "DMA enabled, interrupt disabled"
    },
    "2": {
        "state": "_RequestInterruptEnalbe",
        "description": "Interrupt enabled, DMA disabled"
    },
}

/**
 * Puts calling XBAR_SetOutputSignalConfig  
 * accessRegs - reference to registers to be configured with theirs values
 * return no value
 */
function printXbarSetOutputSignalConfig(accessRegs) {
    var accessRegister = accessRegs[0];
    var reg = accessRegister.register;
    var registerName = reg.registerName;
    var dbPeripheralName = registerDatabaseObject.getPeripheralByFullName(registerName).getName();
    var dbRegister = registerDatabaseObject.getRegisterByFullName(reg.registerName);
    var registerClrSetMask = getBitwiseOr(accessRegister.clrMask, accessRegister.setMask);
    var dbBitFields = dbRegister.getBitFields();
    var offset = 8;
    var configurableMask = 0x0F;
    if (xbarModulesAB) {
        if (dbPeripheralName == 'XBARB') {
            var xbarModulePrefix = 'XBARB';
        } else {
            var xbarModulePrefix = 'XBARA';
        }
    } else {
        var xbarModulePrefix = 'XBAR';
    }
    var orValue = '0x100';
    if (dbPeripheralName == 'XBARB') {
        orValue = '0x200';
    }
    for (var i = 0; i < 2; i++) {
        if (getBitwiseAnd(registerClrSetMask, (getBitwiseShiftLeft(configurableMask, (offset * i)))) > 0) {
            for (var fi = 0; fi < dbBitFields.length; fi++) {
                var bitFieldMask = dbBitFields[fi].getRegisterMask().doubleValue();
                var bitFieldName = dbBitFields[fi].getName();
                if (bitFieldMask == getBitwiseShiftLeft(0x01, (offset * i))) {
                    var otuputIndex = bitFieldName.substring(bitFieldName.length() - 1);
                    var output = xbarOutputSignal[dbPeripheralName][(otuputIndex + '|' + orValue).valueOf()];
                    var bitFieldValueX = getBitwiseAnd(accessRegister.setMask, bitFieldMask) >>> dbBitFields[fi].getOffset();
                }
                if (bitFieldMask == getBitwiseShiftLeft(0x02, (offset * i))) {
                    bitFieldValueX = getBitwiseOr(bitFieldValueX, getBitwiseShiftLeft(getBitwiseAnd(accessRegister.setMask, bitFieldMask) >>> dbBitFields[fi].getOffset(), 1));
                    var requestType = xbarRequestTypeTable[bitFieldValueX];
                }
                if (bitFieldMask == getBitwiseShiftLeft(0x0C, (offset * i))) {
                    var bitFieldValueX = getBitwiseAnd(accessRegister.setMask, bitFieldMask) >>> dbBitFields[fi].getOffset();
                    var activeEdge = xbarActiveEdgeTable[bitFieldValueX];
                }
            }
            if (output != null && requestType != null && activeEdge != null) {
                var activeEdgeIndent = ('.activeEdge = k' + xbarModulePrefix + activeEdge.state + ',').length;
                var requestTypeIndent = ('.requestType = k' + xbarModulePrefix + requestType.state).length;
                var indent = (activeEdgeIndent > requestTypeIndent) ? activeEdgeIndent : requestTypeIndent;
                PExOut_gen(cIndent4 + xbarModulePrefix + '_SetOutputSignalConfig(');
                PExOut_gen(cIndent8 + dbPeripheralName + ', ' + output[0].id + ', ' + makeComment('Configure ' + removeLastDotFromDescription(output[0].description)));
                PExOut_gen(cIndent8 + '&((' + (xbarModulePrefix).toLowerCase() + '_control_config_t){');
                PExOut_gen(cIndent6 + cIndent6 + '.activeEdge = k' + xbarModulePrefix + activeEdge.state + ',' + makeString(' ', indent - activeEdgeIndent + 1) + makeComment(activeEdge.description));
                PExOut_gen(cIndent6 + cIndent6 + '.requestType = k' + xbarModulePrefix + requestType.state + makeString(' ', indent - requestTypeIndent + 1) + makeComment(requestType.description));
                PExOut_gen(cIndent8 + '}));');
            } else {
                logMessage("Unexpected status during SDK function XBAR_SetOutputSignalConfig printing.", false);
            }
        }
    }
    reg.writeFunctions = null;
}


/**
 * Registers using SDK function XBAR_SetOutputSignalConfig 
 * reg - register defined by name, clr mask and set mask
 * writeFunctions - reference to writeFunctions array (collection of data for SDK write functions) 
 * return no value
 */
function enrolXbarSetOutputSignalConfig(reg, writeFunctions, pc) {
    var registerName = reg.registerName;
    var dbRegister = registerDatabaseObject.getRegisterByFullName(reg.registerName);
    var configurableMask = 0x0F0F;
    if (xbarInputSignal != null && xbarOutputSignal != null && registerName.indexOf(xbarPeripheralName) >= 0 && registerName.indexOf(xbarControlRegisterName) >= 0) {
        var writeFunc = new Object();
        writeFunc.printFunction = printXbarSetOutputSignalConfig;
        writeFunc.accessRegisters = new Array();
        var accessRegister = new Object();
        accessRegister.register = reg;
        accessRegister.clrMask = reg.registerClrMask;
        accessRegister.setMask = reg.registerSetMask;
        writeFunc.accessRegisters.push(accessRegister);
        var writeFunctionsIndex = writeFunctions.push(writeFunc) - 1;
        reg.registerClrMask = getBitwiseAnd(reg.registerClrMask, getBitwiseNeg32(configurableMask));
        reg.registerSetMask = getBitwiseAnd(reg.registerSetMask, getBitwiseNeg32(configurableMask));
        if (reg.writeFunctions == null) {
            reg.writeFunctions = new Array();
        }
        reg.writeFunctions.push(writeFunctions[writeFunctionsIndex]);
        include_fsl_xbar['present'] = true;
        include_fsl_xbar['pcs'].push(pc);
    }
}


/**
 * Puts calling DMAMUX_SetSource into output 
 * accessRegs - reference to registers to be configured with values
 * return no value; just prining into ouput
 */
function printDmaMuxSetSource(accessRegs) {
    var accessRegister = accessRegs[0];
    var reg = accessRegister.register;
    var registerName = reg.registerName;
    var dbPeripheralName = registerDatabaseObject.getPeripheralByFullName(registerName).getName();
    var channel = accessRegister.channel;
    var source = accessRegister.source;
    var dbRegister = registerDatabaseObject.getRegisterByFullName(reg.registerName);
    var dbBitFields = dbRegister.getBitFields();
    var orValue = '0x100';
    var peripheralName = null;
    if (dmaCount == 1) {
        if (dbIsDMA0) {
            peripheralName = dmaPeripheralName + '0';
        } else {
            peripheralName = dmaPeripheralName;
        }
    } else { // number of DMA instances is greater than 1
        peripheralName = dmaPeripheralName + dbPeripheralName.substring(dbPeripheralName.indexOf(dmaMuxPeripheralName) + dmaMuxPeripheralName.length);
    }
    if (dbPeripheralName == (dmaMuxPeripheralName + '1')) {
        orValue = '0x200';
    } else {
        if (dbIsDMAMUX1 && (channel >= 16)) {
            orValue = '0x200';
        }
    }
    var requestSource = dmaRequestSource[peripheralName][(source.toString() + '|' + orValue.toString()).valueOf()];
    if (requestSource != null) {
        var selectedRequestSource = requestSource[0];
        // If there is more enums with the same values, then the longest enum id containing name of routed peripheral is choosen. 
        // If there is no enum id containing routed peripheral name then the longest enum id is selected. 
        if (requestSource.length > 1) {
            var routedPeripheralNames = getRoutedPeripheralNames(registerName, accessRegister.configurableMask);
            var enums = new Array();
            for (var p = 0; p < routedPeripheralNames.length; p++) {
                for (var e = 0; e < requestSource.length; e++) {
                    if (requestSource[e].id.indexOf(routedPeripheralNames[p]) >= 0) {
                        if (enums.indexOf(requestSource[e]) == -1) {
                            enums.push(requestSource[e]);
                        }
                    }
                }
            }
            if (enums.length == 1) {
                var selectedRequestSource = enums[0];
            } else {
                if (enums.length > 1) {
                    var enumsKeys = Object.keys(enums).sort(function(a, b) {
                        return (enums[a].id.length - enums[b].id.length);
                    });
                    selectedRequestSource = enums[enumsKeys[enumsKeys.length - 1]];
                } else { //if (enums.length < 1)
                    var requestSourceKeys = Object.keys(requestSource).sort(function(a, b) {
                        return (requestSource[a].id.length - requestSource[b].id.length);
                    });
                    selectedRequestSource = requestSource[requestSourceKeys[requestSourceKeys.length - 1]];
                }
            }
        }
    }
    if (selectedRequestSource != null) {
        var bfDescr = '';
        for (var fi = 0; fi < dbBitFields.length; fi++) {
            var bitFieldMask = dbBitFields[fi].getRegisterMask().doubleValue();
            if (getBitwiseAnd(bitFieldMask, dmaMuxSourceBitMask) > 0) {
                bfDescr = dbBitFields[fi].getDescription() + " " + channel + ': ' + selectedRequestSource.description;
            }
        }
        PExOut_gen(cIndent4 + makeComment(bfDescr));
        PExOut_gen(cIndent4 + 'DMAMUX_SetSource(' + dbPeripheralName + ', ' + channel + 'U, (uint8_t)' + selectedRequestSource.id + ');');
        //PExOut_gen(addCCodeComment(cIndent2 + 'DMAMUX_SetSource(' + dbPeripheralName + ', DMA_CHANNEL' + channel + '_IDX, ' + selectedRequestSource.id + ');', bfDescr));
    }
    reg.writeFunctions = null;
}


/**
 * Registers using SDK function DMAMUX_SetSource 
 * reg - register defined by name, clr mask and set mask
 * writeFunctions - reference to writeFunctions array (collection of data for SDK write functions) 
 * configurationConstantDefinitionList - given configuration where constant definitions are added
 * return no value
 */
function enrolDmaMuxSetSource(reg, writeFunctions, configurationConstantDefinitionList, pc) {
    var registerName = reg.registerName;
    var dbRegister = registerDatabaseObject.getRegisterByFullName(reg.registerName);
    var configurableMask = dmaMuxSourceBitMask;
    var writeFunc = new Object();
    if ((dmaRequestSource != null) && (registerName.indexOf(dmaMuxPeripheralName) >= 0) && (registerName.indexOf(dmaMuxChannelConfigRegisterName) >= 0)) {
        var setValMask = getBitwiseAnd(getBitwiseOr(reg.registerClrMask, reg.registerSetMask), configurableMask);
        if (getBitwiseXor(setValMask, configurableMask) == 0) {
            var setValue = getBitwiseAnd(reg.registerSetMask, setValMask);
            var channel = registerName.substring(registerName.indexOf(dmaMuxChannelConfigRegisterName) + dmaMuxChannelConfigRegisterName.length);
            var source = getBitwiseAnd(setValue, dmaMuxSourceBitMask) >>> dmaMuxSourceBitOffset;
            // registerConstantDefinition('DMA_CHANNEL' + normalizeNumberStr(channel) + '_IDX', 'DMA_CHANNEL' + channel + '_IDX', channel, 'Channel number for DMA channel ' + channel, 'index', configurationConstantDefinitionList);
            // registerConstantDefinition('DMA_REQUEST' + normalizeNumberStr(source) + '_IDX', 'DMA_REQUEST' + source + '_IDX', source, 'Channel source ' + source + ' which is used to trigger DMA transfer', 'index', configurationConstantDefinitionList);
            writeFunc.printFunction = printDmaMuxSetSource;
            writeFunc.accessRegisters = new Array();
            var accessRegister = new Object();
            accessRegister.register = reg;
            accessRegister.setValue = setValue;
            accessRegister.configurableMask = configurableMask;
            accessRegister.channel = channel;
            accessRegister.source = source;
            writeFunc.accessRegisters.push(accessRegister);
            var writeFunctionsIndex = writeFunctions.push(writeFunc) - 1;
            reg.registerClrMask = getBitwiseAnd(reg.registerClrMask, getBitwiseNeg32(configurableMask));
            reg.registerSetMask = getBitwiseAnd(reg.registerSetMask, getBitwiseNeg32(configurableMask));
            if (reg.writeFunctions == null) {
                reg.writeFunctions = new Array();
            }
            reg.writeFunctions.push(writeFunctions[writeFunctionsIndex]);
            include_fsl_dmamux['present'] = true;
            include_fsl_dmamux['pcs'].push(pc);
        }
    }
}


var trgmuxTriggerInputTable = {
    "0": {
        "state": "kTRGMUX_TriggerInput0",
        "description": "The MUX select for peripheral trigger input 0"
    },
    "1": {
        "state": "kTRGMUX_TriggerInput1",
        "description": "The MUX select for peripheral trigger input 1"
    },
    "2": {
        "state": "kTRGMUX_TriggerInput2",
        "description": "The MUX select for peripheral trigger input 2"
    },
    "3": {
        "state": "kTRGMUX_TriggerInput3",
        "description": "The MUX select for peripheral trigger input 3"
    },
}

/**
 * Puts calling TRGMUX_SetTriggerSource  
 * accessRegs - reference to registers to be configured with theirs values
 * return no value; just prining into ouput
 */
function printTrgmuxSetTriggerSource(accessRegs) {
    var accessRegister = accessRegs[0];
    var reg = accessRegister.register;
    var registerName = reg.registerName;
    var dbPeripheralName = registerDatabaseObject.getPeripheralByFullName(registerName).getName();
    var dbRegister = registerDatabaseObject.getRegisterByFullName(reg.registerName);
    var registerClrSetMask = getBitwiseOr(accessRegister.clrMask, accessRegister.setMask);
    var dbBitFields = dbRegister.getBitFields();
    for (var fi = 0; fi < dbBitFields.length; fi++) {
        var bitFieldMask = dbBitFields[fi].getRegisterMask().doubleValue();
        if (getBitwiseAnd(bitFieldMask, registerClrSetMask) > 0) {
            var bitFieldName = dbBitFields[fi].getName();
            if (bitFieldName.indexOf(trgmuxSelBitFieldName) >= 0) {
                var bitFieldValueX = getBitwiseAnd(accessRegister.setMask, bitFieldMask) >>> dbBitFields[fi].getOffset();
                var registerAlias = getRegisterNameStr(registerName);
                var deviceIndex = registerAlias.substring(registerAlias.indexOf(trgmuxRegisterAlias) + trgmuxRegisterAlias.length, registerAlias.indexOf(']'));
                var device = trgmuxDevice[dbPeripheralName][deviceIndex];
                var inputIndex = bitFieldName.substring(bitFieldName.indexOf(trgmuxSelBitFieldName) + trgmuxSelBitFieldName.length);
                var input = trgmuxTriggerInputTable[inputIndex];
                var source = trgmuxSource[dbPeripheralName][bitFieldValueX];
                if (device != null && input != null && source != null) {
                    var bfDescr = "";
                    bfDescr = removeLastDotFromDescription(source[0].description) + ' as ' + removeLastDotFromDescription(device[0].description) + ' ' + inputIndex;
                    PExOut_gen(cIndent4 + makeComment(bfDescr));
                    PExOut_gen(cIndent4 + 'TRGMUX_SetTriggerSource(' + dbPeripheralName + ', ' + device[0].id + ', ' + input.state + ', ' + source[0].id + ');');
                } else {
                    logMessage("Unexpected status during SDK function TRGMUX_SetTriggerSource printing.", false);
                }
            }
        }
    }
    reg.writeFunctions = null;
}


/**
 * Registers using SDK function TRGMUX_SetTriggerSource 
 * reg - register defined by name, clr mask and set mask
 * writeFunctions - reference to writeFunctions array (collection of data for SDK write functions) 
 * configurationConstantDefinitionList - given configuration where constant definitions are added
 * return no value
 */
function enrolTrgmuxSetTriggerSource(reg, writeFunctions, configurationConstantDefinitionList, pc) {
    var registerName = reg.registerName;
    var dbRegister = registerDatabaseObject.getRegisterByFullName(reg.registerName);
    if (trgmuxDevice != null && trgmuxSource != null && registerName.indexOf(trgmuxPeripheralName) >= 0) {
        var writeFunc = new Object();
        writeFunc.printFunction = printTrgmuxSetTriggerSource;
        writeFunc.accessRegisters = new Array();
        var accessRegister = new Object();
        accessRegister.register = reg;
        accessRegister.clrMask = reg.registerClrMask;
        accessRegister.setMask = reg.registerSetMask;
        writeFunc.accessRegisters.push(accessRegister);
        var writeFunctionsIndex = writeFunctions.push(writeFunc) - 1;
        reg.registerClrMask = 0;
        reg.registerSetMask = 0;
        if (reg.writeFunctions == null) {
            reg.writeFunctions = new Array();
        }
        reg.writeFunctions.push(writeFunctions[writeFunctionsIndex]);
        include_fsl_trgmux['present'] = true;
        include_fsl_trgmux['pcs'].push(pc);
    }
}


/**
 * Print a clock register 
 * reg - register defined by name, clr mask and set mask
 * return no value
 */
function printClockRegister(reg) {
    if (codeStyle == "SDK") { //MUX bity/ SDK funkce
        var writeClockFunctions = reg.writeFunctions;
        if (writeClockFunctions != null) {
            for (var wf = 0; wf < writeClockFunctions.length; wf++) {
                writeClockFunctions[wf].printFunction(writeClockFunctions[wf].accessRegisters);
            }
        }
    }
    processRegister(reg, "print");
}

/**
 * Print a register 
 * reg - register defined by name, clr mask and set mask
 * return no value
 */
function printRegister(reg) {
    if (codeStyle == "SDK") {
        var writeFunctions = reg.writeFunctions;
        if (writeFunctions != null) {
            writeFunctions = writeFunctions.filter(function(wf) {return (wf.printFunction.name != 'printGpioPinInit');}).sort(sortPrintFunctions);
            for (var wf = 0; wf < writeFunctions.length; wf++) {
                writeFunctions[wf].printFunction(writeFunctions[wf].accessRegisters);
            }
        }
    }
    processRegister(reg, "print");
}

/** 
 * Analyzes register settings for pin muxing and functional pin properties (electrical features) from the tool.
 * It iterates through all steps and registers and finding and collecting clock gate configurations 
 * pc - index of configuration/function (internally component)
 * configurationSteps - array of configuration register steps 
 */
function analyzeRegisterConfigurationSequence(pc, configurationSteps) {
    /* Analyzing returned data. Iteration through all registers and finding and collecting clock gate configurations */
    registerList[pc] = new Object();
    var configurationRegisterList = registerList[pc];
    clockGateRegisterList[pc] = new Object();
    var configurationClockGateRegisterList = clockGateRegisterList[pc];
    for (var si = 0; si < configurationSteps.length; si++) {
        var configurationStepName = configurationSteps[si].getName();
        var configurationStepDescription = configurationSteps[si].getDescription();
        var configurationRegisters = configurationSteps[si].getRegistersConfigurations();
        for (var ri = 0; ri < configurationRegisters.length; ri++) {
            //var registerDesc = configurationRegisters[ri];
            var registerName = configurationRegisters[ri].getRegisterName();
            var dbPeripheral = registerDatabaseObject.getPeripheralByFullName(registerName);
            var dbRegister = registerDatabaseObject.getRegisterByFullName(registerName);
            if ((dbPeripheral != null) && (dbRegister != null)) {
                if ((!testMode && componentClockGateGeneration[pc]) || (testMode && componentClockGateGeneration[0])) {
                    /* ***** Preparation of clock gate configuration lists ***** */
                    var clockGate = registerDatabaseObject.getClockGate(dbPeripheral, dbRegister);
                    if (clockGate != null) {
                        var clockGateRegisterFullName = clockGate.getControlPeripheralName() + "_" + clockGate.getControlRegisterName();
                        var clockGateField = clockGate.getControlBitField();
                        var clockGateStates = clockGate.getStates();
                        if (clockGateField != null) {
                            for (var gindex = 0; gindex < clockGateStates.length; gindex++) {
                                var aGState = clockGateStates[gindex];
                                var clockGateShiftedValue = getBitwiseShiftLeft(aGState.getValue(), clockGateField.getOffset());
                                if (aGState.getName() == "enabled") {
                                    if (codeStyle == "CMSIS") {
                                        var reg = configurationClockGateRegisterList[clockGateRegisterFullName];
                                        if (reg != null) {
                                            reg.registerSetMask = getBitwiseOr(reg.registerSetMask, clockGateShiftedValue);
                                            reg.registerClrMask = getBitwiseOr(reg.registerClrMask, getBitwiseXor(clockGateShiftedValue, clockGateField.getRegisterMask().doubleValue()));
                                        } else {
                                            configurationClockGateRegisterList[clockGateRegisterFullName] = new Object();
                                            configurationClockGateRegisterList[clockGateRegisterFullName].registerName = clockGateRegisterFullName;
                                            configurationClockGateRegisterList[clockGateRegisterFullName].registerClrMask = getBitwiseXor(clockGateShiftedValue, clockGateField.getRegisterMask().doubleValue());
                                            configurationClockGateRegisterList[clockGateRegisterFullName].registerSetMask = clockGateShiftedValue;
                                        }
                                    } else {
                                        var clockGateName = clockGate.getName();
                                        configurationClockGateRegisterList[clockGateName] = new Object();
                                        configurationClockGateRegisterList[clockGateName].registerName = clockGateName;
                                        configurationClockGateRegisterList[clockGateName].registerClrMask = getBitwiseXor(clockGateShiftedValue, clockGateField.getRegisterMask().doubleValue());
                                        configurationClockGateRegisterList[clockGateName].registerSetMask = clockGateShiftedValue;
                                        configurationClockGateRegisterList[clockGateName].comment = getBitFieldSetMaskDescription(clockGateField.getValues(), aGState.getValue(), clockGateField.getDescription());
                                    }
                                }
                            }
                        }
                    }
                }
                /* ***** Preparation of pin muxing, functional property register configuration lists ***** */
                configurationRegisterList[registerName] = new Object();
                configurationRegisterList[registerName].registerName = registerName;
                configurationRegisterList[registerName].registerClrMask = configurationRegisters[ri].getClrRegMask();
                configurationRegisterList[registerName].registerSetMask = configurationRegisters[ri].getSetRegMask();
            }
        }
    }
}



/**
 * In case of SDK generation style, there are called functions which check each register setting and detect recognize appropriate SDK function usage.
 * These enrol functions register corresponding print functions and data for them. They also mask registerClrMask and registerSetMask accordingly.
 * pc - index of pin configuration (routing function/Pins component)
 * ccd - index of configuration constant definition
 */
function enrolSdkFunctions(pc, ccd) {
    var configurationClockGateRegisterList = clockGateRegisterList[pc];
    writeClockFunctions[pc] = new Array();
    var configurationWriteClockFunctions = writeClockFunctions[pc];
    for (var r in configurationClockGateRegisterList) {
        enrolEnableClock(configurationClockGateRegisterList[r], configurationWriteClockFunctions);
    }
    var configurationRegisterList = registerList[pc];
    var configurationConstantDefinitionList = constantDefinitionList[ccd];
    for (var r in configurationRegisterList) {
        enrolPortSetPinInterruptConfig(configurationRegisterList[r], configurationWriteClockFunctions, configurationConstantDefinitionList, pc);
        enrolPortSetPinConfig(configurationRegisterList[r], configurationWriteClockFunctions, configurationConstantDefinitionList, pc);
        enrolPortSetPinMux(configurationRegisterList[r], configurationWriteClockFunctions, configurationConstantDefinitionList, pc);
        enrolGpioPinInit(configurationRegisterList[r], configurationWriteClockFunctions, configurationConstantDefinitionList, pc);
        enrolPortDisablePinsDigitalFilter(configurationRegisterList[r], configurationWriteClockFunctions, configurationConstantDefinitionList, pc);
        enrolPortEnablePinsDigitalFilter(configurationRegisterList[r], configurationWriteClockFunctions, configurationConstantDefinitionList, pc);
        enrolXbarSetSignalsConnection(configurationRegisterList[r], configurationWriteClockFunctions, pc);
        enrolXbarSetOutputSignalConfig(configurationRegisterList[r], configurationWriteClockFunctions, pc);
        enrolDmaMuxSetSource(configurationRegisterList[r], configurationWriteClockFunctions, configurationConstantDefinitionList, pc);
        enrolTrgmuxSetTriggerSource(configurationRegisterList[r], configurationWriteClockFunctions, configurationConstantDefinitionList, pc);
    }
}


/**
 * Iteration through register settings including clock gate register settings and collecting constant definition data.
 * pc - index of configuration (routing function/Pins component)
 * ccd - index of configuration constant definition
 */
function collectConstantDefinitions(pc, ccd) {
    var configurationConstantDefinitionList = constantDefinitionList[ccd];
    var configurationRegisterList = clockGateRegisterList[pc];
    for (var r in configurationRegisterList) {
        processRegister(configurationRegisterList[r], "constantDefinitions", configurationConstantDefinitionList);
    }
    var configurationRegisterList = registerList[pc];
    for (var r in configurationRegisterList) {
        processRegister(configurationRegisterList[r], "constantDefinitions", configurationConstantDefinitionList);
    }
}


/**
 * Gets "and" mask in order to safe e.g. w1c interrupt status flags in a register.
 * reg - register object (register name and clr and set mask to be configured)
 * dbBitField - database bit filed object 
 */
function getSafeBitFieldBy0MaskStr(reg, dbBitField) {
    var str = "";
    var bitFieldAccess = dbBitField.getAccessId();
    if (bitFieldAccess == "W1C") {
        str = getBitFieldMaskStr(dbBitField);
    }
    return str;
}


/** 
 * Processes register configuration sequence for all pin function configurations
 * coreId - cpu core id
 */
function processRegisterConfigurationSequence(coreId) {
    /*
        How it works:
        - get list of clock gate and pin configuration registers
        - go through the list and 
          - decide if SDK function can be used; add list of reference to register object
          - remove bit fields or whole registers if SDK function is used; whole register is removed by settings "" into "register.registerName"
        - 
        - print the rest of constant definitions
        - print the rest of clock gate registers
        - print the rest of pin configuration registers
    */

    for (var pc = 0; pc < allComponents.length; pc++) { // Pin configuration represented by tables in the UI of the tool
        currentComponent = pc;
        if (coreId == componentCoreIds[pc]) {
            /* Getting register settings for pin muxing and functional pin properties (electrical features) from the tool. There are not included register settings for properties with default/reset values (text with cursive font) */
            constantDefinitionList[pc] = new Object();
            var configurationSteps = PExProcessor.getRegisterConfigurationSequence(true, configurationStrategies[pc], null); // exclude automatic, given function, all steps
            analyzeRegisterConfigurationSequence(pc, configurationSteps);
        }
    }

    /* In case of SDK generation style, there are called functions which check each register setting and detect recognize appropriate SDK function usage.
        These enrol functions register corresponding print functions and data for them. They also mask registerClrMask and registerSetMask accordingly. */
    if (codeStyle == "SDK") {
        for (var pc = 0; pc < allComponents.length; pc++) { // Pin configuration represented by tables in the UI of the tool
            currentComponent = pc;
            if (coreId == componentCoreIds[pc]) {
                enrolSdkFunctions(pc, pc);
            }
        }
    }

    /* Iteration through the rest of register settings including clock gate register settings and collecting constant definition data */
    for (var pc = 0; pc < allComponents.length; pc++) { // Pin configuration represented by tables in the UI of the tool
        currentComponent = pc;
        if (coreId == componentCoreIds[pc]) {
            collectConstantDefinitions(pc, pc);
        }
    }
}

/** 
 * Gets constant definitions length
 * configuration - given configuration where constant definitions is added
 * return value - int the length
 */
function getOneDefinitionConstantSetLineLength(configuration) {
    var maxLength = -1;
    var configurationConstantDefinitionList = constantDefinitionList[configuration];
    var configurationConstantDefinitionKeys = Object.keys(configurationConstantDefinitionList).sort();
    for (var d = 0; d < configurationConstantDefinitionKeys.length; d++) {
        var configurationConstantDefinition = configurationConstantDefinitionList[configurationConstantDefinitionKeys[d]];
        var defName = configurationConstantDefinition.name;
        if (configurationConstantDefinition.indexType == null) {
            var value = getNumberConvertedToHex(configurationConstantDefinition.value);
        } else {
            var value = configurationConstantDefinition.value + 'u';
        }
        if ((getConstantDefinitionStr(defName, value, configurationConstantDefinition.comment)).length > 120) {
            return -1;
        }
        if (configurationConstantDefinition.indexType == null) {
            var length = 8 + defName.length + value.length + 2;
            if (defName in printedConstantDefinitionList) {
                if (avoidDefineRedefinition) {
                    length += 6;
                }
                if (maxLength < length) {
                    maxLength = length;
                }
            }
            if (maxLength < length) {
                maxLength = length;
            }
        }
    }
    return maxLength;
}


/** 
 * Prints constant definitions for one configuration
 * configuration - given configuration where constant definitions is added
 * return value - no data; just printing into output 
 */
function printOneDefinitionConstantSet(configuration) {
    defineLineLength = getOneDefinitionConstantSetLineLength(configuration);
    var printedAnything = false;
    var configurationConstantDefinitionList = constantDefinitionList[configuration];
    var configurationConstantDefinitionKeys = Object.keys(configurationConstantDefinitionList).sort();
    for (var d = 0; d < configurationConstantDefinitionKeys.length; d++) {
        var configurationConstantDefinition = configurationConstantDefinitionList[configurationConstantDefinitionKeys[d]];
        var defName = configurationConstantDefinition.name;
        if (configurationConstantDefinition.indexType == null) {
            var value = getNumberConvertedToHex(configurationConstantDefinition.value);
        } else {
            var value = configurationConstantDefinition.value + 'u';
        }
        if (configurationConstantDefinition.indexType == null) {
            var defLine = getConstantDefinitionStr(defName, value, configurationConstantDefinition.comment);
            if (defName in printedConstantDefinitionList) {
                if (avoidDefineRedefinition) {
                    PExOut_gen("/* " + defLine + " */");
                    printedAnything = true;
                } else {
                    //PExOut_gen('');
                    PExOut_gen(defLine);
                    printedAnything = true;
                }
            } else {
                //PExOut_gen('');
                PExOut_gen(defLine);
                printedConstantDefinitionList[defName] = configuration;
                printedAnything = true;
            }
        }
    }
    defineLineLength = 0;
    return printedAnything;
}

/** 
 * Prints register configurations for one configuration
 * configuration - given configuration where constant definitions is added
 * return value - no data; just printing into output 
 */
function printOneRegisterConfiguration(configuration) {
    currentComponent = configuration;
    var printedAnything = false;
    /* ***** Clock gate enable ***** */
    var configurationRegisterList = clockGateRegisterList[configuration];
    for (var r in configurationRegisterList) {
        printClockRegister(configurationRegisterList[r]);
        printedAnything = true;
    }

    printGpioPinInit(configuration);

    if (printedAnything) {
        //PExOut_gen('');
    }

    /* ***** Pin muxing, functional property Register configurations ***** */
    var configurationRegisterList = registerList[configuration];
    for (var r in configurationRegisterList) {
        printRegister(configurationRegisterList[r]);
    }
}

// Direction enumeration definition
var directionEnumDefinition = [
    "/*! @brief Direction type  */",
    "typedef enum _pin_mux_direction",
    "{",
    "    kPIN_MUX_DirectionInput = 0U,        /* Input direction */",
    "    kPIN_MUX_DirectionOutput = 1U,       /* Output direction */",
    "    kPIN_MUX_DirectionInputOrOutput = 2U /* Input or output direction */",
    "} pin_mux_direction_t;"
]

/** 
 * Prints direction definitions for one configuration
 * configuration - given configuration where constant definitions is added
 * return value - no data; just printing into output 
 */
function printDirectionDefines(configuration) {
    var pin_listProperty = allComponents[configuration].findItemBySymbol("pin_list");
    var numOfItems = pin_listProperty.getItemsCount();
    for (var i = 0; i < numOfItems; i++) {
        var dirItem = allComponents[configuration].findItemBySymbol("direction" + i);
        var pinItem = allComponents[configuration].findItemBySymbol("pin_signal" + i);
        var peripheralItem = allComponents[configuration].findItemBySymbol("peripheral" + i);
        var signalItem = allComponents[configuration].findItemBySymbol("signal" + i);
        if (dirItem != null && pinItem != null && peripheralItem != null && signalItem != null) {
            if (dirItem.getError() == null && pinItem.getError() == null && peripheralItem.getError() == null && signalItem.getError() == null && !dirItem.isReadOnlyInUI()) {
                printLegacy_1_0_Direction(configuration, pinItem, peripheralItem, signalItem, dirItem);
            }
        }
    }
}

function printLegacy_1_0_Direction(configuration, pinItem, peripheralItem, signalItem, dirItem) {
    var signal = (peripheralItem.getTextValue() + "_" + signalItem.getTextValue().replace(GPIOSignalFunction + ",", "").replace(",", "").replace(" ", "")).toUpperCase();
    var comment = "Direction of " + signal + " signal";
    var name = identifierPrefixes[configuration] + signal + "_DIRECTION";
    switch (dirItem.getTextValue()) {
        case "INPUT":
            PExOut_gen(getConstantDefinitionStr(name, "kPIN_MUX_DirectionInput", comment, directionDefineFormat));
            break;
        case "OUTPUT":
            PExOut_gen(getConstantDefinitionStr(name, "kPIN_MUX_DirectionOutput", comment, directionDefineFormat));
            break;
        case "INPUT/OUTPUT":
            PExOut_gen(getConstantDefinitionStr(name, "kPIN_MUX_DirectionInputOrOutput", comment, directionDefineFormat));
            break;
        default:
    }
}

function printCommonIdentifierDefine(identifierDescriptor, identifierBody, oneIdentifier) {
    PExOut_gen(getConstantDefinitionStr(
        identifierBody + identifierDescriptor.identifier + "_PIN_NAME",
        identifierDescriptor.routeTo,
        "Routed pin name",
        directionDefineFormat
    ));
    PExOut_gen(getConstantDefinitionStr(
        identifierBody + identifierDescriptor.identifier + "_LABEL",
        "\"" + identifierDescriptor.label.replace("\\", "\\\\").replace("\"", "\\\"") + "\"",
        "Label",
        directionDefineFormat
    ));
    PExOut_gen(getConstantDefinitionStr(
        identifierBody + identifierDescriptor.identifier + "_NAME",
        "\"" + identifierDescriptor.identifier + "\"",
        "Identifier",
        directionDefineFormat
    ));
    var directionText = null;
    switch (identifierDescriptor.direction) {
        case "INPUT":
            directionText = "kPIN_MUX_DirectionInput";
            break;
        case "OUTPUT":
            directionText = "kPIN_MUX_DirectionOutput";
            break;
        case "INPUT/OUTPUT":
            directionText = "kPIN_MUX_DirectionInputOrOutput";
            break;
        default:
    };
    if (directionText != null) {
        PExOut_gen(getConstantDefinitionStr(
            identifierBody + identifierDescriptor.identifier + "_DIRECTION",
            directionText,
            "Direction",
            directionDefineFormat
        ));
    };
}

function printGeneralIdentifierDefine(identifierDescriptor) {
    var identifierBody = identifierDescriptor.prefix + identifierDescriptor.ipIdentifier + ((identifierDescriptor.ipIdentifier == "") ? '' : '_');
    //PExOut_gen(identifierBody);

    if (generateExtendedHeader) { 
        PExOut_gen("/* Routed pin properties */");
        if (identifierDescriptor.printIpDefine) {
            PExOut_gen(getConstantDefinitionStr(
                identifierBody + identifierDescriptor.identifier + "_PERIPHERAL",
                identifierDescriptor.peripheral,
                "Peripheral name",
                directionDefineFormat
            ));

            PExOut_gen(getConstantDefinitionStr(
                identifierBody + identifierDescriptor.identifier + "_SIGNAL",
                identifierDescriptor.signal,
                "Signal name",
                directionDefineFormat
            ));
        }
    }

    if (generateExtendedHeader) {
        if (identifierDescriptor.channel != null) {
            PExOut_gen(getConstantDefinitionStr(
                identifierBody + identifierDescriptor.identifier + "_CHANNEL",
                identifierDescriptor.channel,
                "Signal channel",
                directionDefineFormat
            ));
        };

        printCommonIdentifierDefine(identifierDescriptor, identifierBody, identifierDescriptor.ipIdentifier);
    }

    printGpioIdentifierDefine(identifierDescriptor);


    if (identifierDescriptor.port != null) {
        PExOut_gen("");
        PExOut_gen("/* Symbols to be used with PORT driver */");

        PExOut_gen(getConstantDefinitionStr(
            identifierBody + identifierDescriptor.identifier + "_PORT",
            identifierDescriptor.port[0],
            "PORT peripheral base pointer",
            directionDefineFormat
        ));

        PExOut_gen(getConstantDefinitionStr(
            identifierBody + identifierDescriptor.identifier + "_PIN",
            identifierDescriptor.pin + "U",
            "PORT pin number",
            directionDefineFormat
        )); 

        PExOut_gen(getConstantDefinitionStr(
            identifierBody + identifierDescriptor.identifier + "_PIN_MASK",
            ("(1U << ") + identifierDescriptor.pin + "U)",
            "PORT pin mask",
            directionDefineFormat
        ));
    }

    doxygenPinDefinesClose();
    return true;
}

function printGpioIdentifierDefine(identifierDescriptor) {
    if (identifierDescriptor.signal != GPIOSignalFunction) {
        return false;
    }
    if (identifierDescriptor.channel == null) {
        return false;
    }
    var channelNumber = parseInt(identifierDescriptor.channel);
    if (isNaN(channelNumber)) {
        return false;
    }
    PExOut_gen("");
    PExOut_gen("/* Symbols to be used with GPIO driver */");

    var identifierArray = identifierDescriptor.identifier.split(";");
    for (var identifierIndex in identifierArray) {
        var oneIdentifier = identifierArray[identifierIndex];
        var identifierBody = identifierDescriptor.prefix + oneIdentifier;

        if (registerDatabaseObject.getPeripheral("F" + identifierDescriptor.peripheral) != null){
            PExOut_gen(getConstantDefinitionStr(
                identifierBody + "_FGPIO",
                "F" + identifierDescriptor.peripheral,
                "FGPIO peripheral base pointer",
                directionDefineFormat
            ));
        }

         PExOut_gen(getConstantDefinitionStr(
            identifierBody + "_GPIO",
            identifierDescriptor.peripheral,
            "GPIO peripheral base pointer",
            directionDefineFormat
        ));

        var PortDeviceName = identifierDescriptor.peripheral.replace(GPIOSignalFunction, "PORT");

        if (generateExtendedHeader) {
            PExOut_gen(getConstantDefinitionStr(
                identifierBody + "_GPIO_PIN",
                channelNumber.toString() + "U",
                "GPIO pin number",
                directionDefineFormat
            ));
        }
        //printCommonIdentifierDefine(identifierDescriptor, identifierBody, oneIdentifier);
     
        PExOut_gen(getConstantDefinitionStr(
            identifierBody + "_GPIO_PIN_MASK",
            ("(1U << ") + channelNumber.toString() + "U)",
            "GPIO pin mask",
            directionDefineFormat
        ));
 }
    return true;
}

function getPortString(pinItem) {
    var PinIdentifier = null;
    var configurationSteps = pinItem.getRegisterConfigurationSequence()
    for (var stepIndex = 0; stepIndex < configurationSteps.length; stepIndex++) {
        var configurationStep = configurationSteps[stepIndex];
        var registersConfigurations = configurationStep.getRegistersConfigurations();
        for (var configurationIndex = 0; configurationIndex < registersConfigurations.length; configurationIndex++) {
            var registerName = registersConfigurations[configurationIndex].getRegisterName();
            var nameSubMatches = registerName.match(/PORT([A-Z])_PCR(\d+)/);
            if (nameSubMatches != null) {
                if (nameSubMatches.length == 3) {
                    PinIdentifier = "PORT" + nameSubMatches[1] + nameSubMatches[2];
                    break;
                }
            }
        }
        if (PinIdentifier != null) {
            break;
        }
    }
    if (PinIdentifier == null) {
        PinIdentifier = pinItem.getSelectedPinNamePart();
    }

    return PinIdentifier;
}

function printIdentifierDefineTitleComment(pinItem, labelText) {
    var PinIdentifier = getPortString(pinItem);

    var titleCommentLine = "";
    titleCommentLine += PinIdentifier;
    var pinCoordinate = pinItem.getSelectedPinCoordinates();
    var pinHasNumber = !/^[A-Z]\d+$/.test(pinCoordinate);
    var isNotBounded = isNotBoundedPin(pinCoordinate);
    var compositePinName = pinItem.getTextValue();
    if (pinCoordinate != "") {
        titleCommentLine += " (" + (isNotBounded ? ("n/b pin") : ((pinHasNumber ? "number " : "coord ") + pinCoordinate)) + ")";
    };
    if ((labelText != null) && (labelText != "")) {
        titleCommentLine += ", " + labelText;
    } else if (PinIdentifier != compositePinName) {
        titleCommentLine += ", " + compositePinName;
    } else if (pinCoordinate == "") {
        titleCommentLine += " internal signal";
    }
    PExOut_gen("/*! @name " + titleCommentLine);
    doxygenPinDefinesOpen();
}

function printIdentifierDefines(configuration) {
    var pin_listProperty = allComponents[configuration].findItemBySymbol("pin_list");
    var identifierPrefix = identifierPrefixes[configuration];
    var peripheryIdentifiersList = new Array();

    var numOfItems = pin_listProperty.getItemsCount();
    for (var i = 0; i < numOfItems; i++) {
        var pinItem = allComponents[configuration].findItemBySymbol("pin_signal" + i);
        var peripheralItem = allComponents[configuration].findItemBySymbol("peripheral" + i);
        var signalItem = allComponents[configuration].findItemBySymbol("signal" + i);
        var identifierItem = allComponents[configuration].findItemBySymbol("identifier" + i);
        var labelItem = allComponents[configuration].findItemBySymbol("label" + i);
        var dirItem = allComponents[configuration].findItemBySymbol("direction" + i);
        var interruptItem = allComponents[configuration].findItemBySymbol("gpio_interrupt" + i);
        if ((peripheralItem != null) && (!(Contains(peripheralItem.getTextValue(), 'GPIO')) || ((interruptItem != null) && Contains(interruptItem.getTextValue(), 'kPORT_') && !(Contains(interruptItem.getTextValue(), 'Disabled'))))) {
            pushDependency(dependencyHelper, createDependency(peripheralItem.getTextValue(), 'Peripheral', configuration));
        }
        if (pinItem != null && peripheralItem != null && signalItem != null && identifierItem != null) {
            if (pinItem.getError() == null && peripheralItem.getError() == null && signalItem.getError() == null && identifierItem.getError() == null) {
                var identifierText = identifierItem.getTextValue();
                if (identifierText != "") {
                    var signalChannelArray = signalItem.getTextValue().split(", ");
                    var identifierDescriptor = {
                        configuration: configuration,
                        item: i,
                        prefix: identifierPrefix,
                        identifier: identifierText,
                        peripheral: peripheralItem.getTextValue(),
                        signal: signalChannelArray[0],
                        channel: null,
                        routeTo: pinItem.getSelectedPinNamePart(),
                        direction: null,
                        label: null,
                        ipIdentifier: null,
                        port: null,
                        pin: null
                    };
                    if (signalChannelArray.length > 1) {
                        identifierDescriptor.channel = signalChannelArray[1];
                    }
                    var labelText = null;
                    if (labelItem != null) {
                        if (labelItem.getError() == null) {
                            labelText = labelItem.getTextValue();
                            identifierDescriptor.label = labelText;
                        }
                    };
                    if (dirItem != null) {
                        if ((dirItem.getError() == null) && (!dirItem.isReadOnlyInUI())) {
                            var dirText = dirItem.getTextValue();
                            identifierDescriptor.direction = dirText;
                        }
                    };

                    if ((peripheralItem) && (peripheralItem.getTextValue())) {
                        identifierDescriptor.ipIdentifier = getPeripheralIdentifier(peripheralItem);
                        var ipDefine = identifierDescriptor.prefix + identifierDescriptor.ipIdentifier + "_PERIPHERAL";

                        identifierDescriptor.printIpDefine = true;
                        peripheryIdentifiersList.push(ipDefine);
                        /*
                        if (inArray(ipDefine, peripheryIdentifiersList) == false) {
                            identifierDescriptor.printIpDefine = true;
                            peripheryIdentifiersList.push(ipDefine);
                        } else {
                            identifierDescriptor.printIpDefine = false;
                        }
                        */
                    }

                    identifierDescriptor.port = getPortFromPinName(getPortString(pinItem));

                    if (identifierDescriptor.port != null) {
                        identifierDescriptor.pin = identifierDescriptor.port[1];
                    }

                    //printIdentifierDefinePeripheral(identifierDescriptor);
                    printIdentifierDefineTitleComment(pinItem, labelText);

                    defineLineLength = getDefineLength(identifierDescriptor);

                    if (Array.isArray(routedPinsDB[pinItem.getSelectedPinCoordinates()])) {
                        routedPinsDB[pinItem.getSelectedPinCoordinates()].push(identifierDescriptor);
                    } else {
                        routedPinsDB[pinItem.getSelectedPinCoordinates()] = new Array(identifierDescriptor);
                    }

                    printGeneralIdentifierDefine(identifierDescriptor);

                    PExOut_gen("");
                }
            }
        } else if (pinItem != null && peripheralItem != null && signalItem != null && dirItem != null) {
            if (pinItem.getError() == null && peripheralItem.getError() == null && signalItem.getError() == null && dirItem.getError() == null && (!dirItem.isReadOnlyInUI())) {
                printLegacy_1_0_Direction(configuration, pinItem, peripheralItem, signalItem, dirItem);
            };
        };
    }
}




/* Prints string array
 * array - string array (one item on one line)
 * stringAtBeginningOfEachLine - string which is placed at the beginning of each line
 * stringAtBeginningOfFirstLine - string which is placed at the beginning of the first line
 * return value - no data; just printing into output 
 */
function printStringArray(array, stringAtBeginningOfEachLine, stringAtBeginningOfFirstLine) {
    if (array.length > 0) {
        for (var lineIndex = 0; lineIndex < array.length; lineIndex++) {
            var line = array[lineIndex];
            if (lineIndex == 0) {
                line = stringAtBeginningOfFirstLine + line;
            }
            line = stringAtBeginningOfEachLine + line;
            PExOut_gen(line);
        }
    }
}

function createDependency(rId, rType, component) {
    if (rType == 'SWComponent') {
        var resId = "platform.drivers." + rId;
        var desc = "Pins initialization requires the " + rId.toUpperCase() + " Driver in the project.";
        var level = 2;
        var fName = "enabled";
    }
    if (rType == 'Peripheral') {
        var resId = rId;
        var desc = "Peripheral " + rId + " is not initialized";
        var level = 1;
        var fName = "initialized";
    }
    var dependency = {
        resourceType: rType,
        resourceId: resId,
        description: desc,
        problem_level: level,
        source: "Pins:" + configurationStrategies[component],
        features: [{
            feature_name: fName,
            evaluation: "equal",
            data: [{
                value: "true",
                unit: null,
                min: null,
                max: null
            }]
        }]
    }

    if (rType == 'SWComponent') {
        dependency.features[0].configuration = getEnabledCoreId(coreListTxt);
    }
    return dependency;
}

var pushedDependencies = {};

function dependencyPushed(dependency) {
    if (!(pushedDependencies[dependency.source])) {
        return false;
    }
    return ((pushedDependencies[dependency.source]).indexOf(dependency.resourceType + dependency.resourceId) > -1);
}

function savePushedDependency(dependency) {
    if (!(pushedDependencies[dependency.source])) {
        pushedDependencies[dependency.source] = new Array();
    }
    pushedDependencies[dependency.source].push(dependency.resourceType + dependency.resourceId);
}

function pushDependency(dependencyHelper, dependency) {
    if (!(dependencyPushed(dependency))) {
        dependencyHelper.addDependency(dependency);
        savePushedDependency(dependency);
    }
}

function registerDependencies() {
    if (projectType == "SDK") {
        for (var pc = 0; pc < configurationStrategies.length; pc++) {
            pushDependency(dependencyHelper, createDependency('common', 'SWComponent', pc));
        }

        if (include_fsl_port['present']) {
            for (var pc = 0; pc < include_fsl_port.pcs.length; pc++) {
                pushDependency(dependencyHelper, createDependency('port', 'SWComponent', include_fsl_port['pcs'][pc]));
            }
        }

        if (include_fsl_gpio['present']) {
            for (var pc = 0; pc < include_fsl_gpio.pcs.length; pc++) {
                pushDependency(dependencyHelper, createDependency('gpio', 'SWComponent', include_fsl_gpio['pcs'][pc]));
            }
        }

        if (xbarModulesAB) {
            if (include_fsl_xbara['present']) {
                for (var pc = 0; pc < include_fsl_xbara.pcs.length; pc++) {
                    pushDependency(dependencyHelper, createDependency('xbara', 'SWComponent', include_fsl_xbara['pcs'][pc]));
                }
            }
            if (include_fsl_xbarb['present']) {
                for (var pc = 0; pc < include_fsl_xbarb.pcs.length; pc++) {
                    pushDependency(dependencyHelper, createDependency('xbarb', 'SWComponent', include_fsl_xbarb['pcs'][pc]));
                }
            }
        } else {
            if (include_fsl_xbar['present']) {
                for (var pc = 0; pc < include_fsl_xbar.pcs.length; pc++) {
                    pushDependency(dependencyHelper, createDependency('xbar', 'SWComponent', include_fsl_xbar['pcs'][pc]));
                }
            }
        }

        if (include_fsl_dmamux['present']) {
            for (var pc = 0; pc < include_fsl_dmamux.pcs.length; pc++) {
                pushDependency(dependencyHelper, createDependency('dmamux', 'SWComponent', include_fsl_dmamux['pcs'][pc]));
            }
        }
        if (include_fsl_trgmux['present']) {
            for (var pc = 0; pc < include_fsl_trgmux.pcs.length; pc++) {
                pushDependency(dependencyHelper, createDependency('trgmux', 'SWComponent', include_fsl_trgmux['pcs'][pc]));
            }
        }
    }
}


function printIncludes() {
    if (projectType == "SDK") {
        //PExOut_gen('#include <stdbool.h>');
        //PExOut_gen('#include \"fsl_device_registers.h\"');
        //PExOut_gen('#include \"fsl_clock.h\"');
        PExOut_gen('#include \"fsl_common.h\"');
        if (include_fsl_port['present']) {
            PExOut_gen('#include \"fsl_port.h\"');
        }
        if (include_fsl_gpio['present']) {
            PExOut_gen('#include \"fsl_gpio.h\"');
        }
        if (xbarModulesAB) {
            if (include_fsl_xbara['present']) {
                PExOut_gen('#include \"fsl_xbara.h\"');
            }
            if (include_fsl_xbarb['present']) {
                PExOut_gen('#include \"fsl_xbarb.h\"');
            }
        } else {
            if (include_fsl_xbar['present']) {
                PExOut_gen('#include \"fsl_xbar.h\"');
            }
        }
        if (include_fsl_dmamux['present']) {
            PExOut_gen('#include \"fsl_dmamux.h\"');
        }
        if (include_fsl_trgmux['present']) {
            PExOut_gen('#include \"fsl_trgmux.h\"');
        }
    } else {
        PExOut_gen('#include \".h\"');
    }
}

var constantDefinitionList = null; // List of constant definition for used bit field values in register setting
var printedConstantDefinitionList = null; // Already printed constant definitions. The purpose is avoid to duplicity in case of more configuration/function/tabs in the tool
var writeClockFunctions = null; // Data container for write functions which print invoking SDK functions for clock gate enabling
var writeFunctions = null; // Data container for write functions which print invoking SDK functions 
var clockGateRegisterList = null; // List of registers for clock gate enable; register is defined by name, clear mask and set mask 
var registerList = null; // List of registers for pin muxing and pin functional properties; register is defined by name, clear mask and set mask 

function getEnabledCoreId(coreListTxt) {
    var coreList = JSON.parse(coreListTxt);
    var coreIds = Object.keys(coreList);
    for (var coreId = 0; coreId < coreIds.length; coreId++) {
        if (coreList[coreIds[coreId]]['enabled']) {
            return coreIds[coreId];
        }
    }
    return null;
}

function printInitFunction(initFunctions) {
    PExOut_gen('');
    PExOut_gen('/* FUNCTION ' + makeString('*', 108));
    PExOut_gen(' *');
    PExOut_gen(' * Function Name : BOARD_InitBootPins');
    PExOut_gen(' * Description   : Calls initialization functions.');
    PExOut_gen(' *');
    PExOut_gen(' * END ' + makeString('*', 112) + '/');
    PExOut_gen('void BOARD_InitBootPins(void)');
    PExOut_gen('{');
    // get list of configurations called as init functions
    for (var i = 0; i < initFunctions.length; i++) {
        var initFunction = initFunctions[i];
        PExOut_gen('    ' + initFunction + '();');
    }
    PExOut_gen('}');
}

function declareInitFunction() {
    PExOut_gen('');
    PExOut_gen('/*!');
    PExOut_gen(' * @brief Calls initialization functions.');
    PExOut_gen(' *');
    PExOut_gen(' */');
    PExOut_gen('void BOARD_InitBootPins(void);');
    PExOut_gen('');
}

function getInitFunctions() {
    var initFunctions = [];

    for (var pc = 0; pc < allComponents.length; pc++) {
        var functionJSON = JSON.parse(allComponents[pc].getComponentOptions());

        if (functionJSON['callFromInitBoot']) {
            initFunctions.push(functionJSON['FunctionName']);
        }
    }
    return initFunctions;
}

/* Creates h and c file and prints theirs body.
 * return value - no data; just printing into output 
 */
function printDriver() {
    for (var coreIndex in notEmptyCoreIds) {
        var coreId = notEmptyCoreIds[coreIndex];
        var moduleNameSuffix = "";
        constantDefinitionList = new Object();
        printedConstantDefinitionList = new Object();
        writeClockFunctions = new Object();
        writeFunctions = new Array();
        clockGateRegisterList = new Object();
        registerList = new Object();

        processRegisterConfigurationSequence(coreId);

        PExOut.setOutputFile(chFileName + moduleNameSuffix + ".h");
        PExOut_gen(warning_message);
        PExOut_gen('#ifndef _' + (moduleName + moduleNameSuffix).toUpperCase() + '_H_');
        PExOut_gen('#define _' + (moduleName + moduleNameSuffix).toUpperCase() + '_H_');
        PExOut_gen('');
        if (generateExtendedHeader){
            PExOut_gen('/' + makeString('*', 119));
            PExOut_gen(' * Definitions');
            PExOut_gen(' ' + makeString('*', 118) + '/');
            PExOut_gen('');
            printStringArray(directionEnumDefinition, '', '');
            PExOut_gen('');
        }
        PExOut_gen('/*!');
        PExOut_gen(' * @addtogroup ' + moduleName + moduleNameSuffix);
        PExOut_gen(' * @{');
        PExOut_gen(' */');
        PExOut_gen('');
        PExOut_gen('/' + makeString('*', 119));
        PExOut_gen(' * API');
        PExOut_gen(' ' + makeString('*', 118) + '/');
        PExOut_gen('');
        PExOut_gen('#if defined(__cplusplus)');
        PExOut_gen('extern \"C\" {');
        PExOut_gen('#endif');
        declareInitFunction();
        for (var pc = 0; pc < allComponents.length; pc++) { // Pin configuration represented by tables in the UI of the tool
            currentComponent = pc;
            if (coreId == componentCoreIds[pc]) {
                configurationStrategy = configurationStrategies[pc];
                if (printOneDefinitionConstantSet(pc)) {
                    PExOut_gen('');
                }
                printIdentifierDefines(pc); // When legacy _DIRECTION line is required, call printDirectionDefines(pc);
                PExOut_gen('/*!');
                printStringArray(allComponents[pc].getDescription(), ' * ', '@brief ');
                PExOut_gen(' *');
                PExOut_gen(' */');
                PExOut_gen('void ' + configurationStrategy + '(void);');
                PExOut_gen('');
            }
        }
        PExOut_gen('#if defined(__cplusplus)');
        PExOut_gen('}');
        PExOut_gen('#endif');
        PExOut_gen('');
        PExOut_gen('/*!');
        PExOut_gen(' * @}');
        PExOut_gen(' */');
        PExOut_gen('#endif /* _' + (moduleName + moduleNameSuffix).toUpperCase() + '_H_ */');
        PExOut_gen('');
        PExOut_gen('/' + makeString('*', 119));
        PExOut_gen(' * EOF');
        PExOut_gen(' ' + makeString('*', 118) + '/');

        PExOut.setOutputFile(chFileName + moduleNameSuffix + ".c");
        PExOut_gen(warning_message);

        if (PExProject.getYamlState() != null) {
        clangOff();
        PExOut_gen('/*');
        PExOut_gen(PExProject.getYamlState());
        PExOut_gen(' */');
        clangOn();
        }
        registerDependencies();

        PExOut_gen('');
        printIncludes();
        PExOut_gen('#include \"' + chFileName + moduleNameSuffix + '.h\"');
        var initFunctions = getInitFunctions();
        printInitFunction(initFunctions);
        for (var pc = 0; pc < allComponents.length; pc++) { // Pin configuration represented by tables in the UI of the tool
            currentComponent = pc;
            if (coreId == componentCoreIds[pc]) {
                configurationStrategy = configurationStrategies[pc];
                PExOut_gen('');

                if (allComponents[pc].getYamlState() != null) {
                clangOff();
                PExOut_gen('/*');
                PExOut_gen(allComponents[pc].getYamlState());
                PExOut_gen(' */');
                clangOn();
                }

                PExOut_gen('');
                PExOut_gen('/* FUNCTION ' + makeString('*', 108));
                PExOut_gen(' *');
                PExOut_gen(' * Function Name : ' + configurationStrategy);
                printStringArray(allComponents[pc].getDescription(), ' * ', 'Description   : ');
                PExOut_gen(' *');
                PExOut_gen(' * END ' + makeString('*', 112) + '/');

                PExOut_gen('void ' + configurationStrategy + '(void)');
                PExOut_gen('{');
                if (registerDatabaseObject != null) {
                    if (allComponents[pc].isErrorInProperty()) {
                        PExOut_gen('    /* There are conflicts or other incorrect settings in the configuration, the code below is generated only for ');
                        PExOut_gen('     * those registers which are set correctly and without a conflict. Open this file in Pins Tool for more details. */');
                        PExOut_gen('');
                    }
                }
                printOneRegisterConfiguration(pc);
                PExOut_gen('}');
                //PExOut_gen('');
            }
        }

        PExOut_gen('/' + makeString('*', 119));
        PExOut_gen(' * EOF');
        PExOut_gen(' ' + makeString('*', 118) + '/');
    }
}



function getMultiConfigurationInOneFunctionHeader(cStyle, clockGateGen) {
    var setting = "Disabled";
    if (clockGateGen) {
        setting = "Enabled";
    }
    return [
        " * This is for internal usage, testing purposes.",
        " * This module contains one function. In the function, there are all routing",
        " * configurations for each pin.",
        " * Options:",
        " *   - Cpu variant                   : " + cpuVariant,
        " *   - Code style                    : " + cStyle,
        " *   - Clock gate enabling generation: " + setting,
        " *"
    ];
}

var _pins_test_library_loc = {
    /* Creates h and c file and prints regression test code.
     * return value - no data; just printing into output 
     */
    printDriverTest: function(testCase, fileName) {
        switch (testCase) {
            case "MultiConfigurationInOneFunction":
            case "MultiConfigurationInOneFunctionWithConfList":
                constantDefinitionList = new Object();
                printedConstantDefinitionList = new Object();
                clockGateRegisterList = new Object();
                writeClockFunctions = new Object();
                writeFunctions = new Array();
                registerList = new Object();

                var map = PExProcessor.getConfigurationsForPinsRegressionTest();
                var cfgIterator = map.entrySet().iterator();
                var testConfigurationNumber = 0;
                var configComments = new Array();
                while (cfgIterator.hasNext()) {
                    var entry = cfgIterator.next();
                    var stepsArr = entry.getValue();
                    configComments.push(entry.getKey());
                    if (stepsArr.length > 0) {
                        //if (testConfigurationNumber <= 3) {
                        constantDefinitionList[testConfigurationNumber] = new Object();
                        analyzeRegisterConfigurationSequence(testConfigurationNumber, stepsArr);
                        testConfigurationNumber++;
                        //}
                        /*
                            var stepIndex = 0;
                            while (stepIndex < stepsArr.length) {
                                var step = stepsArr[stepIndex]; // IPExRegisterConfigurationStepAPI
                                var regsarr = step.getRegistersConfigurations();  //IPExRegisterModificationAPI[]
                                if (regsarr.length > 0) {
                                    var index = 0;
                                    while (index < regsarr.length) {                
                                        var reg = regsarr[index];
                                        PExOut_gen(cIndent2 + reg.getRegisterName() + '.' + reg.getBitFieldName() + ' = 0x' + reg.getSetRegMask().toString(16));
                                        ++index;
                                    }    
                                }
                                ++stepIndex;
                            }
                        } else {
                            PExOut_gen(cIndent2 + '// no code');
                        */
                    }
                }
                /* In case of SDK generation style, there are called functions which check each register setting and detect recognize appropriate SDK function usage.
                   These enrol functions register corresponding print functions and data for them. They also mask registerClrMask and registerSetMask accordingly. */
                if (codeStyle == "SDK") {
                    for (var pc = 0; pc < testConfigurationNumber; pc++) { // Pin configuration represented by tables in the UI of the tool
                        enrolSdkFunctions(pc, 0);
                    }
                }
                /* Iteration through the rest of register settings including clock gate register settings and collecting constant definition data */
                for (var pc = 0; pc < testConfigurationNumber; pc++) { // Pin configuration represented by tables in the UI of the tool
                    collectConstantDefinitions(pc, 0);
                }

                PExOut.setOutputFile(fileName + ".h");
                PExOut_gen('/*');
                printStringArray(getMultiConfigurationInOneFunctionHeader(codeStyle, componentClockGateGeneration[0]), '', '');
                PExOut_gen(' */');
                PExOut_gen('');
                PExOut_gen('#ifndef _' + moduleName.toUpperCase() + '_H_');
                PExOut_gen('#define _' + moduleName.toUpperCase() + '_H_');
                PExOut_gen('');
                PExOut_gen('#if defined(__cplusplus)');
                PExOut_gen('extern \"C\" {');
                PExOut_gen('#endif');
                PExOut_gen('');
                PExOut_gen('/*!');
                PExOut_gen(' * This function executes configuration generated by Pins tool');
                PExOut_gen(' * engine automatically.');
                PExOut_gen(' */');
                PExOut_gen('void ' + configurationStrategies[0] + '(void);');
                PExOut_gen('');
                PExOut_gen('#if defined(__cplusplus)');
                PExOut_gen('}');
                PExOut_gen('#endif');
                PExOut_gen('');
                PExOut_gen('#endif /* _' + moduleName.toUpperCase() + '_H_ */');
                PExOut.setOutputFile(fileName + ".c");
                PExOut_gen('/*');
                printStringArray(getMultiConfigurationInOneFunctionHeader(codeStyle, componentClockGateGeneration[0]), '', '');
                PExOut_gen(' */');
                PExOut_gen('');
                printIncludes();
                PExOut_gen('#include \"' + chFileName + '.h\"');
                PExOut_gen('');
                if (printOneDefinitionConstantSet(0)) {
                    PExOut_gen('');
                }
                PExOut_gen('/*FUNCTION**********************************************************************');
                PExOut_gen(' *');
                PExOut_gen(' * Function Name : Pins_Test');
                PExOut_gen(' * Description   : This function executes configuration generated by Pins tool');
                PExOut_gen(' * engine automatically.');
                PExOut_gen(' * Purpose       : ### REGRESSION TEST ###');
                PExOut_gen(' *END**************************************************************************/');
                PExOut_gen('void ' + configurationStrategies[0] + '(void) {');
                for (var pc = 0; pc < testConfigurationNumber; pc++) { // Pin configuration represented by tables in the UI of the tool
                    PExOut_gen(cIndent2 + '/***** #' + pc + ': ' + configComments[pc] + ' *****/');
                    printOneRegisterConfiguration(pc);
                    PExOut_gen('');
                }
                PExOut_gen('}');
                PExOut_gen('/* ### End of file ### */');

                if (testCase == "MultiConfigurationInOneFunctionWithConfList") {
                    PExOut.setOutputFile(fileName + "_ConfList.txt");
                    PExOut_gen('### Cpu variant ' + cpuVariant + ' ###');
                    PExOut_gen('### List of configurations: ###');
                    for (var pc = 0; pc < testConfigurationNumber; pc++) { // Pin configuration represented by tables in the UI of the tool
                        PExOut_gen('#' + pc + ': ' + configComments[pc]);
                    }
                    PExOut_gen('### End of file ###');
                }
                break;
        }
    },


    /* Creates h and c file and prints regression test code.
     * return value - no data; just printing into output 
     */
    printDriverTestMain: function() {
        this.printDriverTest("MultiConfigurationInOneFunctionWithConfList", chFileName); // Generate each pin configuration for all pins according to option settings (clock gate enabling) including <pin_mux>_ConfList.txt
        codeStyle = "SDK";
        projectType = "SDK";
        componentClockGateGeneration[0] = true;
        this.printDriverTest("MultiConfigurationInOneFunction", chFileName + "_SDK_ClockGates"); // Generate each pin configuration for all pins with preset settings of SDK vs. CMSIS and clock gate generation enabled vs. disable
        codeStyle = "CMSIS";
        projectType = "CMSIS";
        componentClockGateGeneration[0] = true;
        this.printDriverTest("MultiConfigurationInOneFunction", chFileName + "_CMSIS_ClockGates"); // Generate each pin configuration for all pins with preset settings of SDK vs. CMSIS and clock gate generation enabled vs. disable
        codeStyle = "SDK";
        projectType = "SDK";
        componentClockGateGeneration[0] = false;
        this.printDriverTest("MultiConfigurationInOneFunction", chFileName + "_SDK_NoClockGates"); // Generate each pin configuration for all pins with preset settings of SDK vs. CMSIS and clock gate generation enabled vs. disable
        codeStyle = "CMSIS";
        projectType = "CMSIS";
        componentClockGateGeneration[0] = false;
        this.printDriverTest("MultiConfigurationInOneFunction", chFileName + "_CMSIS_NoClockGates"); // Generate each pin configuration for all pins with preset settings of SDK vs. CMSIS and clock gate generation enabled vs. disable
    }

}


if (!testMode) {
    // calls main function
    printDriver();
} else {
    // calls printing regression test
    _pins_test_library_loc.printDriverTestMain();
}