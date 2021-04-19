/*
 * Copyright 2016 Freescale Semiconductor
 * Copyright 2016-2019 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */

/**
 * Functions for making SDK structure field values from clock model state
 *
 */
 
// FieldVal object specifies object which is returned by SDKMapper.getFieldValue function.
var FieldVal = function (value, description, number) {
   this.value = value;
   this.description = description;
   this.number = number;
}; 
 
// SDKMapper object allows mapping a id to sdk enumeration symbol, a number or #define symbol (including "#define <symbol> ..." generation).
SDKMapper = {
      // Reference on define container in c file 
      setCWriterDefineContainer: null,
      
      // Internal function of SDKMapper object. This function adds a #define into container specified by setCWriterDefineContainer
      addCDefine: function (defineSymbol, defineValue, defineComment, formatOptions) {
        if (this.setCWriterDefineContainer != null) {
          this.setCWriterDefineContainer.addDefine(defineSymbol, defineValue, defineComment, formatOptions);
        }            
      },
      
      /* Gets value FieldVal (value, comment and number) for specified id. FieldVal.value can be formated according to parameter formatOptions.
       * Founded value (FieldVal.value) can be replaced by a symbolic constant according to defineSymbolname parameter.
       * cfg - reference to configuration object
       * fieldID - ID of item which should be mapped to number or enumaration or define symbol based on a setting
       * defineSymbolName - if null then no define is added into container specified by setCWriterDefineContainer
       *                  - if "" then define is added into the container named according to data in "mapping" part of this SDKMapper object and the alternative symbol is returned as .value
       *                  - if "<not_empty_string>" then define is added into the container named according to this parameter and the alternative symbol is returned as .value                   
       * formatOptions - determines format of result number in #define, e.g. ["hex"] or ["hex","unsigned"], see parameter options for function OutputUtils.formatField
       *                 it is ignored if defineSymbolName is null       
       * return value - object FieldVal 
       */       
      getFieldValue: function (cfg, fieldID, defineSymbolName, formatOptions) {
         var map = this.mapping[fieldID];               //default reference to the ID mapping object
         if (map == null) {
           scriptApi.logError("[DEBUG] Unsupported field ID " + fieldID + "."); 
           return null;
         }
         if (map[HwAbstr.getMcuFamily(Gen)] != null) {  //use the default reference if there is no Mcu series mapping object
           map = map[HwAbstr.getMcuFamily(Gen)];
         }
         if (formatOptions == null && map.formatOptions) {
           if ("formatOptions" in map) {
             formatOptions = map.formatOptions;
           }
         }
         switch (map.type) {
           case "enum":    
             var kval = map.keyFunc(cfg);
             if (kval == null) {
               scriptApi.logError("[DEBUG] " + map.keyFunc.toString() + " returns null."); 
               return null;
             }
             for (var i=0; i< map.enumMap.length; i++) {
               if (BigNumber.equal(map.enumMap[i][0], kval)) {
                 var ret = new FieldVal(map.enumMap[i][1], map.enumMap[i][2], map.enumMap[i][0]);
                 if (defineSymbolName != null) { 
                   if (defineSymbolName == "") { 
                     if (map.enumMap[i][3] != null && map.enumMap[i][3] != "") {
                       this.addCDefine(map.enumMap[i][1], map.enumMap[i][0], map.enumMap[i][2], formatOptions);
                     }
                   }
                   else {
                     this.addCDefine(defineSymbolName, map.enumMap[i][0], map.enumMap[i][2], formatOptions);
                     ret.value = defineSymbolName;
                   }
                 }
                 else {
                   if (map.enumMap[i][3] != null && map.enumMap[i][3] != "") {
                     ret.value = map.enumMap[i][0];
                   }
                 }
                 return ret;
               }
             }
             scriptApi.logError("[DEBUG] " + "enuMap for " + fieldID + " does not contain value " + kval + "."); 
             return null;
           case "number":
                 var ret = map.expr(cfg);
                 ret.number = ret.value;
                 if (defineSymbolName != null) {
                   if (defineSymbolName == "") { 
                     if ("defineSymbol" in map) {
                       var defineSymbol = map.defineSymbol(cfg, ret);
                       this.addCDefine(defineSymbol, ret.value, ret.description, formatOptions);
                       ret.value = defineSymbol;
                     }
                   }
                   else {
                     this.addCDefine(defineSymbolName, ret.value, ret.description, formatOptions);
                   }
                 }
                 return ret;
           case "multiEnum":
             // Usable for "mask" type enumerations. There can be enumerations which doesn't define anything for state =0. Then in case of there is no enum state in final code, a define needs to be created
             // Examples result code: "kMCG_PllEnableIndependent | kMCG_PllEnableInStop", "kMCG_PllEnableIndependent", "MCG_PLL_DISABLE_INDEPENDENT_DISABLE_IN_STOP"
             var code = "";
             var comment = "";
             // Iterate throught all functions in funcMap, create expression/comment from corresponding row in enumMap and add defines if there is "defineSymbol" in the row
             for (var i=0; i< map.funcMap.length; i++) {
               if (map.funcMap[i][0](cfg)) {
                 var enm = map.enumMap[map.funcMap[i][1]];
                 if (defineSymbolName != null) {
                   if (enm[3] != null && enm[3] != "") {
                     this.addCDefine(enm[1], enm[0], enm[2], formatOptions);
                   }
                   code = code + ((code == "") ? "" : " | ") + enm[1];
                 }
                 else {
                   if (enm[3] != null && enm[3] != "") {
                     code = code + ((code == "") ? "" : " | ") + "0x" + BigNumber.toString(enm[0],16) + "U";
                   }
                   else {
                     code = code + ((code == "") ? "" : " | ") + enm[1];
                   }
                 }
                 comment = comment + ((comment == "") ? "" : ", ") + enm[2];
               }
             }
             // If all functions returned zeros, use symbol "0"
             if (code == "") {
               if (map.enumMap[0] != null) {
                 if (defineSymbolName != null) {
                   if (map.enumMap[0][3] != null && map.enumMap[0][3] != "") {
                     this.addCDefine(map.enumMap[0][1], map.enumMap[0][0], map.enumMap[0][2], formatOptions);
                   }
                   code = code + ((code == "") ? "" : " | ") + map.enumMap[0][1];
                 }
                 else {
                   if (map.enumMap[0][3] != null && map.enumMap[0][3] != "") {
                     code = code + ((code == "") ? "" : " | ") + map.enumMap[0][0];
                   }
                   else {
                     code = code + ((code == "") ? "" : " | ") + "0x" + BigNumber.toString(map.enumMap[0][1],16) + "U";
                   }
                 }
                 comment = comment + ((comment == "") ? "" : ", ") + map.enumMap[0][2];
               }
               else {
                 scriptApi.logError("[DEBUG] " + "enuMap for " + fieldID + " does not contain value 0."); 
                 return null;
               }
             }
             if ("comment" in map) {
               comment = map.comment(cfg);
             }
             if (isNaN(code)) {
               code = "(" + code + ")";
             }
             return new FieldVal(code, comment);
           default:                         
             return null;                  
         }
      },
      
      // Data part of this SDKMapper object. "mapping" contains field ids of certain type and theirs settings.
      // Type of the id can be "number", "enum" or "multiEnum".
      // defineSymbol in an enumMap table or defineSymbol function in <id> object ensures definiton of symbolic constant
      // e.g. there is defined "#define MCG_IRCLK_DISABLE   0U" for [0, "MCG_IRCLK_DISABLE",      "MCGIRCLK disabled", "defineSymbol"],
      //      or "#define RTC_OSC_CAP_LOAD_30PF   0x3c00" for "rtc.oscCapLoad" id
      mapping : {
        "mcgConfig.mcgMode" : {
              type: "enum",
              keyFunc: (function (cfg) { return cfg.getValueAsText("MCGMode") }),
              enumMap:[ 
                ["FEI", "kMCG_ModeFEI",  "FEI - FLL Engaged Internal"],
                ["FBI", "kMCG_ModeFBI",  "FBI - FLL Bypassed Internal"],
                ["BLPI", "kMCG_ModeBLPI", "BLPI - Bypassed Low Power Internal"],
                ["FEE", "kMCG_ModeFEE",  "FEE - FLL Engaged External"],
                ["FBE", "kMCG_ModeFBE",  "FBE - FLL Bypassed External"],
                ["BLPE", "kMCG_ModeBLPE", "BLPE - Bypassed Low Power External"],
                ["PBE", "kMCG_ModePBE",  "PBE - PLL Bypassed Enternal"],
                ["PEE", "kMCG_ModePEE",  "PEE - PLL Engaged External"],
                ["PEI", "kMCG_ModePEI",  "PEE - PLL Engaged Internal"],
                ["ERR","kMCG_ModeError", "Unknown mode"]                      
              ]
        },
        "mcgConfig.irclkEnableMode": {
              type: "enum",
              keyFunc: (function (cfg) { return (ScriptBitFields.getMultiShiftedBitFieldConfigValues(cfg, [["MCG::C1", "IRCLKEN"],["MCG::C1", "IREFSTEN"]])) }),
              enumMap:[ 
                 [0, "MCG_IRCLK_DISABLE",      "MCGIRCLK disabled", "defineSymbol"],          
                 [ScriptBitFields.getMultiShiftedValues([["MCG::C1", "IRCLKEN"],["MCG::C1", "IREFSTEN"]],[0,1]), "kMCG_IrclkEnableInStop", "MCGIRCLK enabled only in STOP mode"],
                 [ScriptBitFields.getMultiShiftedValues([["MCG::C1", "IRCLKEN"],["MCG::C1", "IREFSTEN"]],[1,0]), "kMCG_IrclkEnable",       "MCGIRCLK enabled, MCGIRCLK disabled in STOP mode"],          
                 [ScriptBitFields.getMultiShiftedValues([["MCG::C1", "IRCLKEN"],["MCG::C1", "IREFSTEN"]],[1,1]), "kMCG_IrclkEnable | kMCG_IrclkEnableInStop", "MCGIRCLK enabled as well as in STOP mode"],          
              ]          
        },
        "mcgConfig.ircs": {
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("MCG::C2","IRCS") }),
              enumMap:[ 
                 [0, "kMCG_IrcSlow", "Slow internal reference clock selected"],          
                 [1, "kMCG_IrcFast", "Fast internal reference clock selected"]
              ]          
        },
        "mcgConfig.fcrdiv": {           
           type: "number",   
           expr: (function (cfg) {
                     var tmp = cfg.getBitFieldValueAsBigInteger("MCG::SC", "FCRDIV");
                     return new FieldVal(tmp, "Fast IRC divider: divided by " + cfg.getValueAsText("MCG.FCRDIV.scale"));
                  })   
        },
        "mcgConfig.frdiv": {             
           type: "number",   
           expr: (function (cfg) { 
                     var tmp = cfg.getBitFieldValueAsBigInteger("MCG::C1", "FRDIV");
                     return new FieldVal(tmp, "FLL reference clock divider: divided by " + cfg.getValueAsText("MCG.FRDIV.scale"));
                  })
        },             
        "mcgConfig.drs": {                
           type: "enum",
           keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("MCG::C4","DRST_DRS"); }),
           enumMap:[ 
              [0, "kMCG_DrsLow", "Low frequency range"],          
              [1, "kMCG_DrsMid", "Mid frequency range"],          
              [2, "kMCG_DrsMidHigh", "Mid-High frequency range"],          
              [3, "kMCG_DrsHigh", "High frequency range"],          
           ]          
        },
        "mcgConfig.dmx32": {               
           type: "enum",
           keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("MCG::C4","DMX32"); }),
           enumMap:[ 
              [0, "kMCG_Dmx32Default", "DCO has a default range of 25%"],          
              [1, "kMCG_Dmx32Fine", "DCO is fine-tuned for maximum frequency with 32.768 kHz reference"],          
           ]
        },
        "mcgConfig.oscsel": { 
           type: "enum",
           keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("MCG::C7","OSCSEL") }),
           enumMap:[ 
              [0, "kMCG_OscselOsc", "Selects System Oscillator (OSCCLK)"],          
              [1, "kMCG_OscselRtc", "Selects 32 kHz RTC Oscillator"],          
              [2, "kMCG_OscselIrc", "Selects 48 MHz IRC Oscillator"],          
           ]
        },
        "mcgConfig.pll0Config.enableMode": { 
           type: "enum",
           keyFunc: 
              (function (cfg) {return  (ScriptBitFields.getMultiShiftedBitFieldConfigValues(cfg, [["MCG::C5","PLLCLKEN0"],["MCG::C5","PLLSTEN0"]])) }),          
           enumMap: [
              [0, "MCG_PLL_DISABLE", "MCGPLLCLK disabled", "defineSymbol"],          
              [ScriptBitFields.getMultiShiftedValues([["MCG::C5","PLLCLKEN0"],["MCG::C5","PLLSTEN0"]],[0,1]), "kMCG_PllEnableInStop", "MCGPLLCLK enabled only in STOP mode"],          
              [ScriptBitFields.getMultiShiftedValues([["MCG::C5","PLLCLKEN0"],["MCG::C5","PLLSTEN0"]],[1,0]), "kMCG_PllEnableIndependent", "MCGPLLCLK enabled independent of MCG clock mode, MCGPLLCLK disabled in STOP mode"],          
              [ScriptBitFields.getMultiShiftedValues([["MCG::C5","PLLCLKEN0"],["MCG::C5","PLLSTEN0"]],[1,1]), "kMCG_PllEnableIndependent | kMCG_PllEnableInStop", "MCGPLLCLK enabled independently of MCG clock mode as well as in STOP mode"],          
           ],
        },
        "mcgConfig.pll0Config.prdiv": {
           type: "number",   
           expr: (function (cfg) { 
                     var tmp = cfg.getBitFieldValueAsBigInteger("MCG::C5", "PRDIV");
                     return new FieldVal(tmp, "PLL Reference divider: divided by " + cfg.getValueAsText("MCG.PRDIV.scale"));
                  })   
        },
        "mcgConfig.pll0Config.vdiv": {
           type: "number",   
           expr: (function (cfg) { 
                     var tmp = cfg.getBitFieldValueAsBigInteger("MCG::C6", "VDIV");
                     return new FieldVal(tmp, "VCO divider: multiplied by " + cfg.getValueAsText("MCG.VDIV.scale"));
                  })   
        },
        "mcgConfig.pllcs": {               
           type: "enum",
           keyFunc : (function (cfg) { return cfg.getBitFieldValue("MCG::C11","PLLCS"); }),
           enumMap:[ 
              [0, "kMCG_PllClkSelPll0",   "PLL0 output clock is selected"],          
              [1, "kMCG_PllClkSelExtPll", "The external PLL clock is selected"],          
           ]
        },
        
        "mcgliteConfig.outSrc": {
           type: "enum",
           keyFunc : (function (cfg) { return cfg.getBitFieldValue("MCG::C1","CLKS"); }),
           enumMap:[ 
              [0, "kMCGLITE_ClkSrcHirc",     "MCGOUTCLK source is HIRC"],          
              [1, "kMCGLITE_ClkSrcLirc",     "MCGOUTCLK source is LIRC"],          
              [2, "kMCGLITE_ClkSrcExt",      "MCGOUTCLK source is external clock source"],          
              [3, "kMCGLITE_ClkSrcReserved", "The external PLL clock is selected"],          
           ]
        },
        "mcgliteConfig.irclkEnableMode": {
              type: "enum",
              keyFunc: (function (cfg) { return (ScriptBitFields.getMultiShiftedBitFieldConfigValues(cfg, [["MCG::C1", "IRCLKEN"],["MCG::C1", "IREFSTEN"]])) }),
              enumMap:[ 
                 [0, "MCG_IRCLK_DISABLE",      "MCGIRCLK disabled", "defineSymbol"],          
                 [ScriptBitFields.getMultiShiftedValues([["MCG::C1", "IRCLKEN"],["MCG::C1", "IREFSTEN"]],[0,1]), "kMCGLITE_IrclkEnableInStop", "MCGIRCLK enabled only in STOP mode"],
                 [ScriptBitFields.getMultiShiftedValues([["MCG::C1", "IRCLKEN"],["MCG::C1", "IREFSTEN"]],[1,0]), "kMCGLITE_IrclkEnable",       "MCGIRCLK enabled, MCGIRCLK disabled in STOP mode"],          
                 [ScriptBitFields.getMultiShiftedValues([["MCG::C1", "IRCLKEN"],["MCG::C1", "IREFSTEN"]],[1,1]), "kMCGLITE_IrclkEnable | kMCGLITE_IrclkEnableInStop", "MCGIRCLK enabled as well as in STOP mode"],          
              ]          
        },
        "mcgliteConfig.ircs": {
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("MCG::C2","IRCS") }),
              enumMap:[ 
                 [0, "kMCGLITE_Lirc2M", "Slow internal reference (LIRC) 2 MHz clock selected"],          
                 [1, "kMCGLITE_Lirc8M", "Slow internal reference (LIRC) 8 MHz clock selected"]
              ]          
        },
        "mcgliteConfig.fcrdiv": {
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("MCG::SC","FCRDIV") }),
              enumMap:[ 
                 [0, "kMCGLITE_LircDivBy1",   "Low-frequency Internal Reference Clock Divider: divided by 1"],          
                 [1, "kMCGLITE_LircDivBy2",   "Low-frequency Internal Reference Clock Divider: divided by 2"],          
                 [2, "kMCGLITE_LircDivBy4",   "Low-frequency Internal Reference Clock Divider: divided by 4"],          
                 [3, "kMCGLITE_LircDivBy8",   "Low-frequency Internal Reference Clock Divider: divided by 8"],          
                 [4, "kMCGLITE_LircDivBy16",  "Low-frequency Internal Reference Clock Divider: divided by 16"],          
                 [5, "kMCGLITE_LircDivBy32",  "Low-frequency Internal Reference Clock Divider: divided by 32"],          
                 [6, "kMCGLITE_LircDivBy64",  "Low-frequency Internal Reference Clock Divider: divided by 64"],          
                 [7, "kMCGLITE_LircDivBy128", "Low-frequency Internal Reference Clock Divider: divided by 128"],          
              ]          
        },
        "mcgliteConfig.lircDiv2": {
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("MCG::MC","LIRC_DIV2") }),
              enumMap:[ 
                 [0, "kMCGLITE_LircDivBy1",   "Second Low-frequency Internal Reference Clock Divider: divided by 1"],          
                 [1, "kMCGLITE_LircDivBy2",   "Second Low-frequency Internal Reference Clock Divider: divided by 2"],          
                 [2, "kMCGLITE_LircDivBy4",   "Second Low-frequency Internal Reference Clock Divider: divided by 4"],          
                 [3, "kMCGLITE_LircDivBy8",   "Second Low-frequency Internal Reference Clock Divider: divided by 8"],          
                 [4, "kMCGLITE_LircDivBy16",  "Second Low-frequency Internal Reference Clock Divider: divided by 16"],          
                 [5, "kMCGLITE_LircDivBy32",  "Second Low-frequency Internal Reference Clock Divider: divided by 32"],          
                 [6, "kMCGLITE_LircDivBy64",  "Second Low-frequency Internal Reference Clock Divider: divided by 64"],          
                 [7, "kMCGLITE_LircDivBy128", "Second Low-frequency Internal Reference Clock Divider: divided by 128"],          
              ]          
        },
        "mcgliteConfig.hircEnableInNotHircMode": {
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("MCG::MC","HIRCEN") }),
              enumMap:[ 
                 [0, "false", "HIRC source is not enabled"],          
                 [1, "true",  "HIRC source is enabled"],          
              ]          
        },
        "mcgliteConfig.fastIrclkFreq": {
           type: "number",   
           expr: (function (cfg) { 
                     var freq = cfg.getValueAsText("MCG.FAST_IRCLK.outFreq");
                     if (freq != "N/A") {                      
                       freq = cfg.getValueAsBigInteger("MCG.FAST_IRCLK.outFreq"); 
                     }                      
                     return new FieldVal(freq, "FAST_IRCLK frequency: " + freq + "Hz");  
                  })   
        },       
        "mcgliteConfig.fastIrclkFreqDefault": {
           type: "number",   
           expr: (function (cfg) { 
                     var freq = cfg.getDefaultValueAsText("MCG.FAST_IRCLK.outFreq");
                     if (freq != "N/A") {                      
                       freq = cfg.getDefaultValueAsBigInteger("MCG.FAST_IRCLK.outFreq"); 
                     }                      
                     return new FieldVal(freq, "FAST_IRCLK default frequency: " + freq + "Hz");  
                  })   
        },       
        "mcgliteConfig.slowIrclkFreq": {
           type: "number",   
           expr: (function (cfg) { 
                     var freq = cfg.getValueAsText("MCG.SLOW_IRCLK.outFreq");
                     if (freq != "N/A") {                      
                       freq = cfg.getValueAsBigInteger("MCG.SLOW_IRCLK.outFreq"); 
                     }                      
                     return new FieldVal(freq, "SLOW_IRCLK frequency: " + freq + "Hz");  
                  })   
        },       
        "mcgliteConfig.slowIrclkFreqDefault": {
           type: "number",   
           expr: (function (cfg) { 
                     var freq = cfg.getDefaultValueAsText("MCG.SLOW_IRCLK.outFreq");
                     if (freq != "N/A") {                      
                       freq = cfg.getDefaultValueAsBigInteger("MCG.SLOW_IRCLK.outFreq"); 
                     }                      
                     return new FieldVal(freq, "SLOW_IRCLK default frequency: " + freq + "Hz");  
                  })   
        },       
  
        ///////////////////////// oscConfig ///////////////////////////////////
        
        "oscConfig.freq": {
           type: "number",   
           expr: (function (cfg) { 
                     var freq = cfg.getValueAsText("OSC.OSC.outFreq");
                     if (freq != "N/A") {                      
                       freq = cfg.getValueAsBigInteger("OSC.OSC.outFreq"); 
                     }                      
                     return new FieldVal(freq, "Oscillator frequency: " + freq + "Hz");  
                  })   
        },       
        "oscConfig.capLoad": {
           type: "multiEnum",
           funcMap:[ 
              [(function (cfg) {return  cfg.getBitFieldValueAsBigInteger("OSC0::CR","SC2P") }), "sc2p"],          
              [(function (cfg) {return  cfg.getBitFieldValueAsBigInteger("OSC0::CR","SC4P") }), "sc4p"],          
              [(function (cfg) {return  cfg.getBitFieldValueAsBigInteger("OSC0::CR","SC8P") }), "sc8p"],          
              [(function (cfg) {return  cfg.getBitFieldValueAsBigInteger("OSC0::CR","SC16P") }), "sc16p"],          
           ],
           enumMap: {
              0 :      [0, "OSC_CAP0P",   "Oscillator 0pF capacitor load", "defineSymbol"],          
              "sc2p" : [ScriptBitFields.getShiftedValue("OSC0::CR","SC2P",1), "kOSC_Cap2P",  "Oscillator 2pF capacitor load"],          
              "sc4p":  [ScriptBitFields.getShiftedValue("OSC0::CR","SC4P",1), "kOSC_Cap4P",  "Oscillator 4pF capacitor load"],          
              "sc8p":  [ScriptBitFields.getShiftedValue("OSC0::CR","SC8P",1), "kOSC_Cap8P",  "Oscillator 8pF capacitor load"],          
              "sc16p": [ScriptBitFields.getShiftedValue("OSC0::CR","SC16P",1), "kOSC_Cap16P", "Oscillator 16pF capacitor load"],          
           },
           comment: (function (cfg) {
                     var cap = 2 * (BigNumber.shiftLeft(this.funcMap[3][0](cfg), 3) + BigNumber.shiftLeft(this.funcMap[2][0](cfg), 2) 
                                    + BigNumber.shiftLeft(this.funcMap[1][0](cfg), 1) + this.funcMap[0][0](cfg));
                     return "Oscillator capacity load: " + cap.toString() + "pF";
           })
         },       
        "oscConfig.workMode": {
              type: "enum",
              keyFunc : (function (cfg) { return ScriptBitFields.getMultiShiftedBitFieldConfigValues(cfg, [["MCG::C2","EREFS0"],["MCG::C2","HGO0"]]) }),
              enumMap:[ 
                 [0, "kOSC_ModeExt", "Use external clock"],          
                 [ScriptBitFields.getMultiShiftedValues([["MCG::C2","EREFS0"],["MCG::C2","HGO0"]],[1,0]), "kOSC_ModeOscLowPower", "Oscillator low power"],
                 [ScriptBitFields.getMultiShiftedValues([["MCG::C2","EREFS0"],["MCG::C2","HGO0"]],[1,1]), "kOSC_ModeOscHighGain", "Oscillator high gain"],
              ]          
        },                
        "oscConfig.oscerConfig.enableMode": {
           type: "enum",
           keyFunc: 
              (function (cfg) {return  (ScriptBitFields.getMultiShiftedBitFieldConfigValues(cfg, [["OSC0::CR","ERCLKEN"],["OSC0::CR","EREFSTEN"]])) }),          
           enumMap: [
              [0, "OSC_ER_CLK_DISABLE", "Disable external reference clock", "defineSymbol"],          
              [ScriptBitFields.getMultiShiftedValues([["OSC0::CR","ERCLKEN"],["OSC0::CR","EREFSTEN"]],[0,1]), "kOSC_ErClkEnableInStop", "Enable external reference clock only in STOP mode"],          
              [ScriptBitFields.getMultiShiftedValues([["OSC0::CR","ERCLKEN"],["OSC0::CR","EREFSTEN"]],[1,0]), "kOSC_ErClkEnable", "Enable external reference clock, disable external reference clock in STOP mode"],          
              [ScriptBitFields.getMultiShiftedValues([["OSC0::CR","ERCLKEN"],["OSC0::CR","EREFSTEN"]],[1,1]), "kOSC_ErClkEnable | kOSC_ErClkEnableInStop", "Enable external reference clock, enable external reference clock in STOP mode"],          
           ]
        },              
        "oscConfig.oscerConfig.erclkDiv": {
           type: "number",   
           expr: (function (cfg) { 
                     var tmp = cfg.getBitFieldValue("OSC0::DIV", "ERPS");
                     return new FieldVal(tmp, "Divider for OSCERCLK: divided by " + cfg.getValueAsText("OSC.ERPS.scale"));
                  })   
        },       
        "coreClock": {
           type: "number",   
           expr: (function (cfg) {                      
                     var freq = cfg.getValueAsText("Core_clock.outFreq");
                     if (freq != "N/A") {                      
                       freq = cfg.getValueAsBigInteger("Core_clock.outFreq"); 
                     }                      
                     return new FieldVal(freq, "Core clock frequency: " + freq + "Hz");  
                  })   
        },
        
        ///////////////////////////// simConfig //////////////////////////////
        
        "simConfig.pllFllSel": {
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("SIM::SOPT2", "PLLFLLSEL") }),
              enumMap:[ 
                 [0, "SIM_PLLFLLSEL_MCGFLLCLK_CLK", "PLLFLL select: MCGFLLCLK clock", "defineSymbol"],
                 [1, "SIM_PLLFLLSEL_MCGPLLCLK_CLK", "PLLFLL select: MCGPLLCLK clock", "defineSymbol"],
                 [2, "SIM_PLLFLLSEL_USB1PFDCLK_CLK", "PLLFLL select: USB1PFDCLK clock", "defineSymbol"],
                 [3, "SIM_PLLFLLSEL_IRC48MCLK_CLK", "PLLFLL select: IRC48MCLK clock", "defineSymbol"],
              ]
        },       
        "simConfig.pllFllDiv": {
           type: "number",   
           expr: (function (cfg) { 
                     var tmp = cfg.getBitFieldValue("SIM::CLKDIV3", "PLLFLLDIV");
                     return new FieldVal(tmp, "PLLFLLSEL clock divider divisor: divided by " + cfg.getValueAsText("SIM.PLLFLLDIV.scale"));
                  })   
        },       
        "simConfig.pllFllFrac": {
           type: "number",   
           expr: (function (cfg) { 
                     var tmp = cfg.getBitFieldValue("SIM::CLKDIV3", "PLLFLLFRAC");
                     return new FieldVal(tmp, "PLLFLLSEL clock divider fraction: multiplied by " + cfg.getValueAsText("SIM.PLLFLLFRAC.scale"));
                  })   
        },       
        "simConfig.er32kSrc": {
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("SIM::SOPT1", "OSC32KSEL") }),
              enumMap:[ 
                 [0, "SIM_OSC32KSEL_OSC32KCLK_CLK", "OSC32KSEL select: OSC32KCLK clock", "defineSymbol"],
                 [2, "SIM_OSC32KSEL_RTC32KCLK_CLK", "OSC32KSEL select: RTC32KCLK clock (32.768kHz)", "defineSymbol"],
                 [3, "SIM_OSC32KSEL_LPO_CLK", "OSC32KSEL select: LPO clock", "defineSymbol"],
              ]
        },       
        "simConfig.clkdiv1": {
           type: "number",   
           expr: (function (cfg) { 
                     var outDivList = new Array();
                     outDivList.push(["SIM::CLKDIV1", "OUTDIV1"]);
                     if (HwAbstr.clockElementExist(cfg, "simOutDiv2")) {
                       outDivList.push(["SIM::CLKDIV1", "OUTDIV2"]);
                     }
                     if (HwAbstr.clockElementExist(cfg, "simOutDiv3")) {
                       outDivList.push(["SIM::CLKDIV1", "OUTDIV3"]);
                     }
                     outDivList.push(["SIM::CLKDIV1", "OUTDIV4"]);
                     var outdiv = ScriptBitFields.getMultiShiftedBitFieldConfigValues(cfg, outDivList);
                     var comment = "SIM_CLKDIV1 - ";
                     var commentList = new Array();
                     commentList.push("OUTDIV1: /" + cfg.getValueAsText("SIM.OUTDIV1.scale"));
                     if (HwAbstr.clockElementExist(cfg, "simOutDiv2")) {
                       commentList.push("OUTDIV2: /" + cfg.getValueAsText("SIM.OUTDIV2.scale"));
                     }
                     if (HwAbstr.clockElementExist(cfg, "simOutDiv3")) {
                       commentList.push("OUTDIV3: /" + cfg.getValueAsText("SIM.OUTDIV3.scale"));
                     }
                     commentList.push("OUTDIV4: /" + cfg.getValueAsText("SIM.OUTDIV4.scale"));
                     comment += commentList.join(", ");
                     return new FieldVal(outdiv, comment); 
                  })   
        },  
        

        ///////////////////////// sim for peripherals ///////////////////////////////////

        "sim.pllFllDiv": {
           type: "number",   
           expr: (function (cfg) { 
                     var tmp = cfg.getBitFieldValue("SIM::CLKDIV3", "PLLFLLDIV");
                     return new FieldVal(tmp, "PLLFLLSEL clock divider divisor: divided by " + cfg.getValueAsText("SIM.PLLFLLDIV.scale"));
                  }),   
           defineSymbol: (function(cfg, exprResult) { return ("SIM_PLLFLLSEL_DIV_" + exprResult.value); }),
        },       

        "sim.pllFllFrac": {
           type: "number",   
           expr: (function (cfg) { 
                     var tmp = cfg.getBitFieldValue("SIM::CLKDIV3", "PLLFLLFRAC");
                     return new FieldVal(tmp, "PLLFLLSEL clock divider fraction: multiplied by " + cfg.getValueAsText("SIM.PLLFLLFRAC.scale"));
                  }),   
           defineSymbol: (function(cfg, exprResult) { return ("SIM_PLLFLLSEL_FRAC_" + exprResult.value); }),
        },       

        "sim.rtcClkOutSel": {
           // Default is according to Kinetis K
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("SIM::SOPT2", "RTCCLKOUTSEL") }),
              enumMap:[ 
                 [0, "SIM_RTC_CLKOUT_SEL_RTC1HZCLK_CLK", "RTC clock output select: RTC1HzCLK clock", "defineSymbol"],
                 [1, "SIM_RTC_CLKOUT_SEL_RTC32KCLK_CLK", "RTC clock output select: RTC32KCLK clock (32.768kHz)", "defineSymbol"]          
              ],
           "Kinetis L":{
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("SIM::SOPT2", "RTCCLKOUTSEL") }),
              enumMap:[ 
                 [0, "SIM_RTC_CLKOUT_SEL_RTC1HZCLK_CLK", "RTC clock output select: RTC1HzCLK clock", "defineSymbol"],
                 [1, "SIM_RTC_CLKOUT_SEL_OSCERCLK_CLK",  "RTC clock output select: OSCERCLK clock", "defineSymbol"]          
              ]
           },          
        },

        "sim.rtcClkInFreq": {
              type: "number",   
              expr: (function (cfg) {                      
                     var freq = cfg.getValueAsText("SIM.RTC_CLK_EXT_IN.outFreq");
                     if (freq != "N/A") {                      
                       freq = cfg.getValueAsBigInteger("SIM.RTC_CLK_EXT_IN.outFreq"); 
                     }                      
                     return new FieldVal(freq, "RTC_CLKIN frequency: " + freq + "Hz");  
                  }),   
              defineSymbol: (function(cfg, exprResult) { return ("RTC_CLKIN_" + exprResult.value + "HZ"); }),
        },
        
        "sim.usbSrcSel":{
           // Default is according to Kinetis K
              type: "enum",
              keyFunc : (function (cfg) { return (ScriptBitFields.getMultiShiftedBitFieldConfigValues(cfg, [["SIM::SOPT2", "USBSRC"],["SIM::SOPT2", "PLLFLLSEL"]])) }),
              enumMap:[ 
                 [ScriptBitFields.getMultiShiftedValues([["SIM::SOPT2", "USBSRC"],["SIM::SOPT2", "PLLFLLSEL"]],[0,0]), "kCLOCK_UsbSrcExt", "USB clock select: USB_CLKIN"],
                 [ScriptBitFields.getMultiShiftedValues([["SIM::SOPT2", "USBSRC"],["SIM::SOPT2", "PLLFLLSEL"]],[0,1]), "kCLOCK_UsbSrcExt", "USB clock select: USB_CLKIN"],
                 [ScriptBitFields.getMultiShiftedValues([["SIM::SOPT2", "USBSRC"],["SIM::SOPT2", "PLLFLLSEL"]],[0,2]), "kCLOCK_UsbSrcExt", "USB clock select: USB_CLKIN"],
                 [ScriptBitFields.getMultiShiftedValues([["SIM::SOPT2", "USBSRC"],["SIM::SOPT2", "PLLFLLSEL"]],[0,3]), "kCLOCK_UsbSrcExt", "USB clock select: USB_CLKIN"],
                 // [ScriptBitFields.getMultiShiftedValues([["SIM::SOPT2", "USBSRC"],["SIM::SOPT2", "PLLFLLSEL"]],[1,0]), "kCLOCK_UsbSrcFll", "USB clock select: FLL clock"],      FLL is not supported by SDK function CLOCK_EnableUsbfs0Clock, probably 48MHz is not achievable from FLL source   
                 [ScriptBitFields.getMultiShiftedValues([["SIM::SOPT2", "USBSRC"],["SIM::SOPT2", "PLLFLLSEL"]],[1,1]), "kCLOCK_UsbSrcPll0", "USB clock select: PLL clock"],          
                 [ScriptBitFields.getMultiShiftedValues([["SIM::SOPT2", "USBSRC"],["SIM::SOPT2", "PLLFLLSEL"]],[1,2]), "kCLOCK_UsbSrcUsbPfd", "USB clock select: USB PFD clock"],          
                 [ScriptBitFields.getMultiShiftedValues([["SIM::SOPT2", "USBSRC"],["SIM::SOPT2", "PLLFLLSEL"]],[1,3]), "kCLOCK_UsbSrcIrc48M", "USB clock select: IRC48M clock"],          
              ],
              formatOptions: ["hex","unsigned"],          
           "Kinetis L":{
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("SIM::SOPT2", "USBSRC") }),
              enumMap:[ 
                 [0, "kCLOCK_UsbSrcExt",    "USB clock select: USB_CLKIN"],
                 [1, "kCLOCK_UsbSrcIrc48M", "USB clock select: IRC48M clock"]          
              ]
           },          
        },

        "sim.simUsbFreq":{
           // Default is according to Kinetis K
              type: "number",
              expr : (function (cfg) { 
                         var freq = 0;
                         if (cfg.getBitFieldValueAsBigInteger("SIM::SOPT2", "USBSRC") == 0) {
                           freq = cfg.getValueAsText("SIM.USBSRCSEL.outFreq");
                           if (freq != "N/A") {                      
                             freq = cfg.getValueAsBigInteger("SIM.USBSRCSEL.outFreq"); 
                           }
                         }
                         else {
                           freq = cfg.getValueAsText("SIM.PLLFLLSEL.outFreq");
                           if (freq != "N/A") {                      
                             freq = cfg.getValueAsBigInteger("SIM.PLLFLLSEL.outFreq"); 
                           }
                         }
                         var comment = "Input SIM frequency for USB: " + freq + "Hz";
                         return new FieldVal(freq, comment) }),
              defineSymbol: (function(cfg, exprResult) { return ("SIM_USB_CLK_" + exprResult.value + "HZ"); }),
           "Kinetis L":{
              type: "number",
              expr : (function (cfg) { 
                         var freq = 0;
                         if (cfg.getBitFieldValueAsBigInteger("SIM::SOPT2", "USBSRC") == 0) {
                           freq = cfg.getValueAsText("SIM.USBSRCSEL.outFreq");
                           if (freq != "N/A") {                      
                             freq = cfg.getValueAsBigInteger("SIM.USBSRCSEL.outFreq"); 
                           }
                         }
                         else {
                           freq = cfg.getValueAsText("MCGPCLK.outFreq");
                           if (freq != "N/A") {                      
                             freq = cfg.getValueAsBigInteger("MCGPCLK.outFreq"); 
                           }
                         }
                         var comment = "Input SIM frequency for USB: " + freq + "Hz";
                         return new FieldVal(freq, comment) }),
              defineSymbol: (function(cfg, exprResult) { return ("SIM_USB_CLK_" + exprResult.value + "HZ"); }),
           },
        },
        
        "sim.usbSlowSrcSel":{
              type: "enum",
              keyFunc : (function (cfg) { return (cfg.getBitFieldValue("SIM::SOPT2", "USBSLSRC")) }),
              enumMap:[ 
                 [0, "SIM_USB_SLOW_CLK_SEL_MCGIRCLK_CLK",  "USB slow clock select: MCGIRCLK clock", "defineSymbol"],
                 [1, "SIM_USB_SLOW_CLK_SEL_RTC32KCLK_CLK", "USB slow clock select: RTC32KCLK clock (32.768kHz)", "defineSymbol"],
              ],
        },

        "sim.enetTimerSrcSel":{
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("SIM::SOPT2", "TIMESRC") }),
              enumMap:[ 
                 [0, "SIM_ENET_1588T_CLK_SEL_CORE_SYSTEM_CLK", "SDHC clock select: Core/system clock", "defineSymbol"],
                 [1, "SIM_ENET_1588T_CLK_SEL_PLLFLLSEL_CLK",   "SDHC clock select: PLLFLLSEL output clock", "defineSymbol"],
                 [2, "SIM_ENET_1588T_CLK_SEL_OSCERCLK_CLK",    "SDHC clock select: OSCERCLK clock", "defineSymbol"],
                 [3, "SIM_ENET_1588T_CLK_SEL_CLKIN_CLK",       "SDHC clock select: CLKIN (External bypass clock)", "defineSymbol"],
              ]          
        },

        "sim.enetRmiiSrcSel":{
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("SIM::SOPT2", "RMIISRC") }),
              enumMap:[ 
                 [0, "SIM_ENET_RMII_CLK_SEL_EXTAL_CLK", "SDHC clock select: Core/system clock", "defineSymbol"],
                 [1, "SIM_ENET_RMII_CLK_SEL_CLKIN_CLK", "SDHC clock select: CLKIN (External bypass clock)", "defineSymbol"],
              ]          
        },
        
        "sim.sdhcSrcSel":{
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("SIM::SOPT2", "SDHCSRC") }),
              enumMap:[ 
                 [0, "SIM_SDHC_CLK_SEL_CORE_SYSTEM_CLK", "SDHC clock select: Core/system clock", "defineSymbol"],
                 [1, "SIM_SDHC_CLK_SEL_PLLFLLSEL_CLK",   "SDHC clock select: PLLFLLSEL output clock", "defineSymbol"],
                 [2, "SIM_SDHC_CLK_SEL_OSCERCLK_CLK",    "SDHC clock select: OSCERCLK clock", "defineSymbol"],
                 [3, "SIM_SDHC_CLK_SEL_CLKIN_CLK",       "SDHC clock select: CLKIN (External bypass clock)", "defineSymbol"],
              ]          
        },
        
        "sim.clkoutSrcSel":{
           // Default is according to Kinetis K
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("SIM::SOPT2", "CLKOUTSEL") }),
              enumMap:[ 
                 [0, "SIM_CLKOUT_SEL_FLEXBUS_CLK",   "CLKOUT pin clock select: FlexBus clock", "defineSymbol"],
                 [2, "SIM_CLKOUT_SEL_FLASH_CLK",     "CLKOUT pin clock select: Flash clock", "defineSymbol"],
                 [3, "SIM_CLKOUT_SEL_LPO_CLK",       "CLKOUT pin clock select: LPO clock", "defineSymbol"],
                 [4, "SIM_CLKOUT_SEL_MCGIRCLK_CLK",  "CLKOUT pin clock select: MCGIRCLK clock", "defineSymbol"],
                 [5, "SIM_CLKOUT_SEL_RTC32KCLK_CLK", "CLKOUT pin clock select: RTC32KCLK clock (32.768kHz)", "defineSymbol"],
                 [6, "SIM_CLKOUT_SEL_OSCERCLK_CLK",  "CLKOUT pin clock select: OSCERCLK clock", "defineSymbol"],
                 [7, "SIM_CLKOUT_SEL_IRC48MCLK_CLK", "CLKOUT pin clock select: IRC48MCLK clock", "defineSymbol"],
              ],          
           "Kinetis L":{
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("SIM::SOPT2", "CLKOUTSEL") }),
              enumMap:[ 
                 [2, "SIM_CLKOUT_SEL_BUS_CLK",       "CLKOUT pin clock select: Bus clock", "defineSymbol"],
                 [3, "SIM_CLKOUT_SEL_LPO_CLK",       "CLKOUT pin clock select: LPO clock", "defineSymbol"],
                 [4, "SIM_CLKOUT_SEL_LIRC_CLK",      "CLKOUT pin clock select: LIRC clock", "defineSymbol"],
                 [6, "SIM_CLKOUT_SEL_OSCERCLK_CLK",  "CLKOUT pin clock select: OSCERCLK clock", "defineSymbol"],
                 [7, "SIM_CLKOUT_SEL_IRC48M_CLK",    "CLKOUT pin clock select: IRC48M clock", "defineSymbol"],
              ],          
           },
        },
        
        "sim.traceSrcSel":{
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValueAsBigInteger("SIM::SOPT2", "TRACECLKSEL") }),
              enumMap:[ 
                 [0, "SIM_TRACE_CLK_SEL_MCGOUTCLK_CLK",   "Trace clock select: FlexBus clock", "defineSymbol"],
                 [1, "SIM_TRACE_CLK_SEL_CORE_SYSTEM_CLK", "Trace clock select: Core/system clock", "defineSymbol"],
              ]          
        },

        "sim.lpuartSrcSel":{
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("SIM::SOPT2", "LPUARTSRC") }),
              enumMap:[ 
                 [0, "SIM_LPUART_CLK_SEL_DISABLED",      "LPUART clock select: Clock disabled", "defineSymbol"],
                 [1, "SIM_LPUART_CLK_SEL_PLLFLLSEL_CLK", "LPUART clock select: PLLFLLSEL output clock", "defineSymbol"],
                 [2, "SIM_LPUART_CLK_SEL_OSCERCLK_CLK",  "LPUART clock select: OSCERCLK clock", "defineSymbol"],
                 [3, "SIM_LPUART_CLK_SEL_MCGIRCLK_CLK",  "LPUART clock select: MCGIRCLK clock", "defineSymbol"],
              ]          
        },

        "sim.lpuart0SrcSel":{
           // Default is according to Kinetis L
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("SIM::SOPT2", "LPUART0SRC") }),
              enumMap:[ 
                 [0, "SIM_LPUART_CLK_SEL_DISABLED",      "LPUART clock select: Clock disabled", "defineSymbol"],
                 [1, "SIM_LPUART_CLK_SEL_IRC48M_CLK",    "LPUART clock select: IRC48M clock", "defineSymbol"],
                 [2, "SIM_LPUART_CLK_SEL_OSCERCLK_CLK",  "LPUART clock select: OSCERCLK clock", "defineSymbol"],
                 [3, "SIM_LPUART_CLK_SEL_MCGIRCLK_CLK",  "LPUART clock select: MCGIRCLK clock", "defineSymbol"],
              ]          
        },

        "sim.lpuart1SrcSel":{
           // Default is according to Kinetis L
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("SIM::SOPT2", "LPUART1SRC") }),
              enumMap:[ 
                 [0, "SIM_LPUART_CLK_SEL_DISABLED",      "LPUART clock select: Clock disabled", "defineSymbol"],
                 [1, "SIM_LPUART_CLK_SEL_IRC48M_CLK",    "LPUART clock select: IRC48M clock", "defineSymbol"],
                 [2, "SIM_LPUART_CLK_SEL_OSCERCLK_CLK",  "LPUART clock select: OSCERCLK clock", "defineSymbol"],
                 [3, "SIM_LPUART_CLK_SEL_MCGIRCLK_CLK",  "LPUART clock select: MCGIRCLK clock", "defineSymbol"],
              ]          
        },

        "sim.lpi2c0SrcSel":{
           // Default is according to Kinetis S
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("SIM::SOPT2", "LPI2C0SRC") }),
              enumMap:[ 
                 [0, "SIM_LPI2C_CLK_SEL_DISABLED",      "LPI2C clock select: Clock disabled", "defineSymbol"],
                 [1, "SIM_LPI2C_CLK_SEL_PLLFLLSEL_CLK", "LPI2C clock select: PLLFLLSEL output clock", "defineSymbol"],
                 [2, "SIM_LPI2C_CLK_SEL_OSCERCLK_CLK",  "LPI2C clock select: OSCERCLK clock", "defineSymbol"],
                 [3, "SIM_LPI2C_CLK_SEL_MCGIRCLK_CLK",  "LPI2C clock select: MCGIRCLK clock", "defineSymbol"],
              ]          
        },

        "sim.lpi2c1SrcSel":{
           // Default is according to Kinetis S
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("SIM::SOPT2", "LPI2C1SRC") }),
              enumMap:[ 
                 [0, "SIM_LPI2C_CLK_SEL_DISABLED",      "LPI2C clock select: Clock disabled", "defineSymbol"],
                 [1, "SIM_LPI2C_CLK_SEL_PLLFLLSEL_CLK", "LPI2C clock select: PLLFLLSEL output clock", "defineSymbol"],
                 [2, "SIM_LPI2C_CLK_SEL_OSCERCLK_CLK",  "LPI2C clock select: OSCERCLK clock", "defineSymbol"],
                 [3, "SIM_LPI2C_CLK_SEL_MCGIRCLK_CLK",  "LPI2C clock select: MCGIRCLK clock", "defineSymbol"],
              ]          
        },

        "sim.flexioSrcSel":{
           // Default is according to Kinetis K
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("SIM::SOPT2", "FLEXIOSRC") }),
              enumMap:[ 
                 [0, "SIM_FLEXIO_CLK_SEL_CORE_SYSTEM_CLK", "FLEXIO clock select: Core/system clock", "defineSymbol"],
                 [1, "SIM_FLEXIO_CLK_SEL_PLLFLLSEL_CLK",   "FLEXIO clock select: PLLFLLSEL output clock", "defineSymbol"],
                 [2, "SIM_FLEXIO_CLK_SEL_OSCERCLK_CLK",    "FLEXIO clock select: OSCERCLK clock", "defineSymbol"],
                 [3, "SIM_FLEXIO_CLK_SEL_MCGIRCLK_CLK",    "FLEXIO clock select: MCGIRCLK clock", "defineSymbol"],
              ],          
           "Kinetis L":{
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("SIM::SOPT2", "FLEXIOSRC") }),
              enumMap:[ 
                 [0, "SIM_FLEXIO_CLK_SEL_DISABLED",        "FLEXIO clock select: Clock disabled", "defineSymbol"],
                 [1, "SIM_FLEXIO_CLK_SEL_IRC48M_CLK",      "FLEXIO clock select: IRC48M clock", "defineSymbol"],
                 [2, "SIM_FLEXIO_CLK_SEL_OSCERCLK_CLK",    "FLEXIO clock select: OSCERCLK clock", "defineSymbol"],
                 [3, "SIM_FLEXIO_CLK_SEL_MCGIRCLK_CLK",    "FLEXIO clock select: MCGIRCLK clock", "defineSymbol"],
              ],          
           },
           "Kinetis S":{
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("SIM::SOPT2", "FLEXIOSRC") }),
              enumMap:[ 
                 [0, "SIM_FLEXIO_CLK_SEL_FLEXIOS0_CLK",    "FLEXIO clock select: FLEXIOS0 output clock", "defineSymbol"],
                 [1, "SIM_FLEXIO_CLK_SEL_PLLFLLSEL_CLK",   "FLEXIO clock select: PLLFLLSEL output clock", "defineSymbol"],
                 [2, "SIM_FLEXIO_CLK_SEL_OSCERCLK_CLK",    "FLEXIO clock select: OSCERCLK clock", "defineSymbol"],
                 [3, "SIM_FLEXIO_CLK_SEL_MCGIRCLK_CLK",    "FLEXIO clock select: MCGIRCLK clock", "defineSymbol"],
              ],          
           },
        },

        "sim.flexioS0SrcSel":{
           // Default is according to Kinetis S
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("SIM::MISCCTL", "FlexIOS0") }),
              enumMap:[ 
                 [0, "SIM_FLEXIOS0_CLK_SEL_CORE_SYSTEM_CLK", "FLEXIOS0 clock select: Core/system clock", "defineSymbol"],
                 [1, "SIM_FLEXIOS0_CLK_SEL_I2S0_MCLK",       "FLEXIOS0 clock select: I2S0_MCLK clock", "defineSymbol"],
              ],
        },          

        "sim.emvsimSrcSel":{
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("SIM::SOPT2", "EMVSIMSRC") }),
              enumMap:[ 
                 [0, "SIM_EMVSIM_CLK_SEL_DISABLED",      "EMVSIM clock select: Clock disabled", "defineSymbol"],
                 [1, "SIM_EMVSIM_CLK_SEL_PLLFLLSEL_CLK", "EMVSIM clock select: PLLFLLSEL output clock", "defineSymbol"],
                 [2, "SIM_EMVSIM_CLK_SEL_OSCERCLK_CLK",  "EMVSIM clock select: OSCERCLK clock", "defineSymbol"],
                 [3, "SIM_EMVSIM_CLK_SEL_MCGIRCLK_CLK",  "EMVSIM clock select: MCGIRCLK clock", "defineSymbol"],
              ]          
        },

        "sim.tpmSrcSel":{
           // Default is according to Kinetis K
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("SIM::SOPT2", "TPMSRC") }),
              enumMap:[ 
                 [0, "SIM_TPM_CLK_SEL_DISABLED",      "TPM clock select: Clock disabled", "defineSymbol"],
                 [1, "SIM_TPM_CLK_SEL_PLLFLLSEL_CLK", "TPM clock select: PLLFLLSEL output clock", "defineSymbol"],
                 [2, "SIM_TPM_CLK_SEL_OSCERCLK_CLK",  "TPM clock select: OSCERCLK clock", "defineSymbol"],
                 [3, "SIM_TPM_CLK_SEL_MCGIRCLK_CLK",  "TPM clock select: MCGIRCLK clock", "defineSymbol"],
              ],          
           "Kinetis L":{
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("SIM::SOPT2", "TPMSRC") }),
              enumMap:[ 
                 [0, "SIM_TPM_CLK_SEL_DISABLED",      "TPM clock select: Clock disabled", "defineSymbol"],
                 [1, "SIM_TPM_CLK_SEL_IRC48M_CLK",    "TPM clock select: IRC48M clock", "defineSymbol"],
                 [2, "SIM_TPM_CLK_SEL_OSCERCLK_CLK",  "TPM clock select: OSCERCLK clock", "defineSymbol"],
                 [3, "SIM_TPM_CLK_SEL_MCGIRCLK_CLK",  "TPM clock select: MCGIRCLK clock", "defineSymbol"],
              ],          
           },
        },

        "sim.traceDivVal": {
           type: "number",   
           expr: (function (cfg) { 
                     var tmp = cfg.getBitFieldValue("SIM::CLKDIV4", "TRACEDIV");
                     return new FieldVal(tmp, "Trace clock divider divisor: divided by " + cfg.getValueAsText("SIM.TRACEDIV.scale"));
                  }),   
           defineSymbol: (function(cfg, exprResult) { return ("SIM_TRACE_CLK_DIV_" + cfg.getValueAsText("SIM.TRACEDIV.scale")); }),
        },       

        "sim.traceFracVal": {
           type: "number",   
           expr: (function (cfg) { 
                     var tmp = cfg.getBitFieldValue("SIM::CLKDIV4", "TRACEFRAC");
                     return new FieldVal(tmp, "Trace clock divider fraction: multiplied by " + cfg.getValueAsText("SIM.TRACEFRAC.scale"));
                  }),   
           defineSymbol: (function(cfg, exprResult) { return ("SIM_TRACE_CLK_FRAC_" + cfg.getValueAsText("SIM.TRACEFRAC.scale")); }),
        },       

        "sim.copSrcSel":{
           // Default is according to Kinetis L
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("SIM::COPC", "COPCLKSEL") }),
              enumMap:[ 
                 [0, "kCOP_LpoClock",   "COP clock select: LPO clock"],
                 [1, "kCOP_McgIrClock", "COP clock select: MCGIRCLK clock"],
                 [2, "kCOP_OscErClock", "COP clock select: OSCERCLK clock"],
                 [3, "kCOP_BusClock",   "COP clock select: BUS clock"],
              ]          
        },

        ///////////////////////// rtc ///////////////////////////////////
        "rtc.rtc32khzClock": {
           type: "number",   
           expr: (function (cfg) {                      
                     var freq = cfg.getValueAsText("RTC.RTC32kHz.outFreq");
                     if (freq != "N/A") {                      
                       freq = cfg.getValueAsBigInteger("RTC.RTC32kHz.outFreq"); 
                     }                      
                     return new FieldVal(freq, "RTC clock frequency: " + freq + "Hz");  
                  })   
        },
        
        "rtc.rtc32khzToPeripheralsInv": {  //inverted so "ENABLED" symbol is 1U instead of 0U
              type: "enum",
              keyFunc : (function (cfg) { return BigNumber.bitwiseXor(cfg.getBitFieldValueAsBigInteger("RTC::CR", "CLKO"), 1) }),
              enumMap:[ 
                 [0, "RTC_RTC32KCLK_PERIPHERALS_DISABLED", "RTC32KCLK to other peripherals: disabled", "defineSymbol"],          
                 [1, "RTC_RTC32KCLK_PERIPHERALS_ENABLED",  "RTC32KCLK to other peripherals: enabled", "defineSymbol"],
              ]          
        },
        
        "rtc.oscCapLoad":{
              type: "number",
              expr : (function (cfg) { 
                         var cap = this.helperFunctions.getCapInPF(cfg);
                         var val = ScriptBitFields.getMultiShiftedBitFieldConfigValues(cfg, [
                                     ["RTC::CR","SC2P"],
                                     ["RTC::CR","SC4P"],
                                     ["RTC::CR","SC8P"],
                                     ["RTC::CR","SC16P"]]);
                         var comment = "RTC oscillator capacity load: " + cap.toString() + "pF";
                         return new FieldVal(val, comment) }),
              defineSymbol: (function(cfg, exprResult) {
                         return ("RTC_OSC_CAP_LOAD_" + this.helperFunctions.getCapInPF(cfg) + "PF"); }),
              helperFunctions: {
                         getCapInPF: function (cfg) {
                             return 2 * (BigNumber.shiftLeft(cfg.getBitFieldValueAsBigInteger("RTC::CR","SC16P"), 3) 
                                         + BigNumber.shiftLeft(cfg.getBitFieldValueAsBigInteger("RTC::CR","SC8P"), 2) 
                                         + BigNumber.shiftLeft(cfg.getBitFieldValueAsBigInteger("RTC::CR","SC4P"), 1) 
                                         + cfg.getBitFieldValueAsBigInteger("RTC::CR","SC2P"));
                         }},    
              formatOptions: ["hex","unsigned"],          
           /* It can be used in future if SDK enumeration would defined for RTC_SetOscCapLoad SDK function 
           type: "multiEnum",
           funcMap:[ 
              [(function (cfg) {return  cfg.getBitFieldValueAsBigInteger("RTC::CR","SC2P") }), "sc2p"],          
              [(function (cfg) {return  cfg.getBitFieldValueAsBigInteger("RTC::CR","SC4P") }), "sc4p"],          
              [(function (cfg) {return  cfg.getBitFieldValueAsBigInteger("RTC::CR","SC8P") }), "sc8p"],          
              [(function (cfg) {return  cfg.getBitFieldValueAsBigInteger("RTC::CR","SC16P") }), "sc16p"],          
           ],
           enumMap: {
              0 :      [0, "kRTC_OSC_CAP0P",  "RTC oscillator 0pF capacitor load"],          
              "sc2p" : [ScriptBitFields.getShiftedValue("RTC::CR","SC2P",1), "kRTC_OSC_CAP2P",  "RTC oscillator 2pF capacitor load"],          
              "sc4p":  [ScriptBitFields.getShiftedValue("RTC::CR","SC4P",1), "kRTC_OSC_CAP4P",  "RTC oscillator 4pF capacitor load"],          
              "sc8p":  [ScriptBitFields.getShiftedValue("RTC::CR","SC8P",1), "kRTC_OSC_CAP8P",  "RTC oscillator 8pF capacitor load"],          
              "sc16p": [ScriptBitFields.getShiftedValue("RTC::CR","SC16P",1), "kRTC_OSC_CAP16P", "RTC oscillator 16pF capacitor load"],          
           },
           comment: (function (cfg) {
                     var cap = 2 * (BigNumber.shiftLeft(this.funcMap[3][0](cfg), 3) 
                                    + BigNumber.shiftLeft(this.funcMap[2][0](cfg), 2) 
                                    + BigNumber.shiftLeft(this.funcMap[1][0](cfg), 1) 
                                    + this.funcMap[0][0](cfg));
                     return "RTC oscillator capacity load: " + cap.toString() + "pF";
           })
           */
        },

        "rtc.enableOsc": {  //enable or not the OSC oscillator using rtc OSCE bit
              type: "enum",
              keyFunc : (function (cfg) { return ((cfg.getValueAsText("MCG_C2_OSC_MODE_CFG") == "RTCLowPower")? 1 : 0) }),
              enumMap:[ 
                 [0, "RTC_OSC_NOT_ENABLED", "Oscillator is not enabled (no changes)", "defineSymbol"],
                 [1, "RTC_OSC_ENABLED",     "Oscillator is enabled", "defineSymbol"]          
              ]          
        },
        
        ///////////////////////// usbphy ///////////////////////////////////

        "usbphy.pfdFrac": {
           type: "number",   
           expr: (function (cfg) { 
                     var tmp = cfg.getBitFieldValue("USBPHY::ANACTRL", "PFD_FRAC");
                     return new FieldVal(tmp, "PFD fractional divider: divided by " + cfg.getValueAsText("USBPHY.PFD_FRAC_DIV.scale"));
                  }),   
           defineSymbol: (function(cfg, exprResult) { return ("USBPHY_PFD_FRAC_DIV_" + cfg.getValueAsText("USBPHY.PFD_FRAC_DIV.scale")); }),
        },       

        "usbphy.pfdClkSel": {
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("USBPHY::ANACTRL", "PFD_CLK_SEL") }),
              enumMap:[ 
                 [0, "USBPHY_PFD_CLK_SEL_OSCERCLK_UNDIV_CLK", "PFD clock select: OSCERCLK_UNDIV clock", "defineSymbol"],
                 [1, "USBPHY_PFD_CLK_SEL_PFD_CLK_DIV_4",      "PFD clock select: pfd_clk clock divided by 4", "defineSymbol"],
                 [2, "USBPHY_PFD_CLK_SEL_PFD_CLK_DIV_2",      "PFD clock select: pfd_clk clock divided by 2", "defineSymbol"],
                 [3, "USBPHY_PFD_CLK_SEL_PFD_CLK",            "PFD clock select: pfd_clk clock", "defineSymbol"],
              ]          
        },       
        // In the future as soon as SDK implements clock_usb_pfd_src_t enumeration (and function CLOCK_EnableUsbhs0PfdClock)
        /*
        "usbphy.pfdClkSel": {
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("USBPHY::ANACTRL", "PFD_CLK_SEL") }),
              enumMap:[ 
                 [0, "kCLOCK_UsbPfdSrcExt",        "PFD clock select: OSCERCLK_UNDIV clock"],
                 [1, "kCLOCK_UsbPfdSrcFracDivBy4", "PFD clock select: pfd_clk clock divided by 4"],
                 [2, "kCLOCK_UsbPfdSrcFracDivBy2", "PFD clock select: pfd_clk clock divided by 2"],
                 [3, "kCLOCK_UsbPfdSrcFrac",       "PFD clock select: pfd_clk clock"],
              ]          
        },
        */       

        ///////////////////////// i2s/sai ///////////////////////////////////

        "i2s0.mclkInputSelect": {
           // Default is according to Kinetis S
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("I2S0::MCR", "MICS") }),
              enumMap:[ 
                 [0, "I2S_MCLK_INPUT_CLK_SEL_CORE_SYSTEM_CLK", "I2S MCLK input clock select: Core/system clock", "defineSymbol"],
                 [1, "I2S_MCLK_INPUT_CLK_SEL_OSCERCLK_CLK",    "I2S MCLK input clock select: OSCERCLK clock", "defineSymbol"],
                 [3, "I2S_MCLK_INPUT_CLK_SEL_PLLFLLSEL_CLK",   "I2S MCLK input clock select: PLLFLLSEL output clock", "defineSymbol"],
              ]          
        },

        "i2s0.mclkInputSelectEnum": {
           // Default is according to Kinetis S
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("I2S0::MCR", "MICS") }),
              enumMap:[ 
                 [0, "kSAI_MclkSourceSysclk",  "I2S MCLK input clock select: Core/system clock"],
                 [1, "kSAI_MclkSourceSelect1", "I2S MCLK input clock select: OSCERCLK clock"],
                 [3, "kSAI_MclkSourceSelect3", "I2S MCLK input clock select: PLLFLLSEL output clock"],
              ]          
        },

        "i2s0.mclkFrac": {
           type: "number",   
           expr: (function (cfg) { 
                     var tmp = cfg.getBitFieldValue("I2S0::MDR", "FRACT");
                     return new FieldVal(tmp, "I2S MCLK fractional divider: multiplied by  " + cfg.getValueAsText("SIM.I2S0_FRACT.scale"));
                  }),   
           defineSymbol: (function(cfg, exprResult) { return ("I2S_MCLK_FRAC_" + cfg.getValueAsText("SIM.I2S0_FRACT.scale")); }),
        },       

        "i2s0.mclkDiv": {
           type: "number",   
           expr: (function (cfg) { 
                     var tmp = cfg.getBitFieldValue("I2S0::MDR", "DIVIDE");
                     return new FieldVal(tmp, "I2S MCLK divider: divided by  " + cfg.getValueAsText("SIM.I2S0_DIVIDE.scale"));
                  }),   
           defineSymbol: (function(cfg, exprResult) { return ("I2S_MCLK_DIV_" + cfg.getValueAsText("SIM.I2S0_DIVIDE.scale")); }),
        },       

        "i2s0.mclkOutputEnable": {
           // Default is according to Kinetis S
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("I2S0::MCR", "MOE") }),
              enumMap:[ 
                 [0, "I2S_MCLK_AS_INPUT",  "I2S MCLK configured as input.", "defineSymbol"],
                 [1, "I2S_MCLK_AS_OUTPUT", "I2S MCLK configured as output from the MCLK. MCLK divider is enabled.", "defineSymbol"],
              ]          
        },

        "i2s0.mclkOutputEnableBool": {
           // Default is according to Kinetis S
              type: "enum",
              keyFunc : (function (cfg) { return cfg.getBitFieldValue("I2S0::MCR", "MOE") }),
              enumMap:[ 
                 [0, "false", "I2S MCLK configured as input."],
                 [1, "true",  "I2S MCLK configured as output from the MCLK. MCLK divider is enabled."],
              ]          
        },
        
        "i2s0.mclkFreq": {
           // Default is according to Kinetis S
           type: "number",   
           expr: (function (cfg) { 
                     var freq = cfg.getValueAsText("SIM.I2S0_MOESEL.outFreq");
                     if (freq != "N/A") {                      
                       freq = cfg.getValueAsBigInteger("SIM.I2S0_MOESEL.outFreq"); 
                     }                      
                     return new FieldVal(freq, "I2S MCLK frequency: " + freq + "Hz");  
                  })   
        },       

        "i2s0.mclkInClkSelectFreq": {
           // Default is according to Kinetis S
           type: "number",   
           expr: (function (cfg) { 
                     var freq = cfg.getValueAsText("SIM.I2S0_MICS.outFreq");
                     if (freq != "N/A") {                      
                       freq = cfg.getValueAsBigInteger("SIM.I2S0_MICS.outFreq"); 
                     }                      
                     return new FieldVal(freq, "I2S MCLK source clock frequency: " + freq + "Hz");  
                  })   
        },       

        "i2s0.mclkInExtFreq": {
           // Default is according to Kinetis S
           type: "number",   
           expr: (function (cfg) { 
                     var freq = cfg.getValueAsText("SIM.I2S0_MCLK_IN_EXT.outFreq");
                     if (freq != "N/A") {                      
                       freq = cfg.getValueAsBigInteger("SIM.I2S0_MCLK_IN_EXT.outFreq"); 
                     }                      
                     return new FieldVal(freq, "I2S MCLK source clock frequency: " + freq + "Hz");  
                  })   
        },       

      } // mapping  
};    
