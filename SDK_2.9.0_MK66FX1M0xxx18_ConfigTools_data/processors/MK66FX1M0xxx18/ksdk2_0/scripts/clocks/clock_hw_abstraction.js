/*
 * Copyright 2016 Freescale Semiconductor
 * Copyright 2016-2019 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */

// HW abstraction object 
var HwAbstr = {

  /**
   * Returns Mcu series
   *
   * @param gen Clock code generation object
   * @return Mcu series, e.g. "Kinetis L"
   */
  getMcuFamily: function(gen) {
    return gen.profile.getMcuInfo().getSeries();
  },
  
  /**
   * Returns currently set Power mode for the configuration
   *
   * @param cfg Current configuration.
   * @return Power mode setting
   */
  getPowerMode: function(cfg) {
    // return Power mode for a given configuration
    return cfg.getValueAsText("powerMode");
  },
  
  /**
   * Returns currently set MCG mode for the configuration
   *
   * @param cfg Current configuration.
   * @return MCG mode setting
   */
  getMCGMode: function(cfg) {
    var powerMode = this.getPowerMode(cfg);
    // return MCG mode for a given configuration
    if (powerMode == "STOP" || powerMode == "VLPS" || powerMode == "LLS" || powerMode == "VLLS0" || powerMode == "VLLS1" || powerMode == "VLLS2" || powerMode == "VLLS3" || powerMode == "BAT") {
      return "N/A";
    }
    else {
      return cfg.getValueAsText("MCGMode");
    }
  },
  
  /**
   * Returns whether MCG lite is on the processor
   *
   * @param cfg Current configuration.
   * @return true - MCG lite, false - full MCG is on processor
   */
  isMcgLite: function() {
    return HwAbstr.clockElementExist(Gen.configs[0], "mcgLirc");
  },
  
  /**
   * Returns setting of Initialize USBPHY clock configuration element
   *
   * @param cfg Current configuration.
   * @return Initialize USBPHY clock setting
   */
  getUsbPhySetting: function(cfg) {
    return cfg.getValueAsText("USBPHYConfig");
  },
  
  /**
   * Returns setting of Initialize FlexIO clock configuration element
   *
   * @param cfg Current configuration.
   * @return Initialize FlexIO clock setting
   */
  getFlexioClkSetting: function(cfg) {
    return cfg.getValueAsText("FLEXIOClkConfig");
  },
  
  /**
   * Returns setting of Initialize RTC clock configuration element
   *
   * @param cfg Current configuration.
   * @return Initialize USBPHY clock setting
   */
  getRtcSetting: function(cfg) {
    return cfg.getValueAsText("RTCClkConfig");
  },
    
  /* Checks all configurations on general settings and reports errors, warnings and info.
   * Typically external oscillator settings related to balast connected to the processor. 
   * E.g. settings of capacitors should be the same for all configurations.
   * return value - no data 
   */
  checkGeneralSettings: function() {
    
    var theSame = HwAbstr.isSettingSameInAllConfigurations("OSC.OSC.outFreq", "osc", "asInteger");
    if (theSame != null && !theSame) {
      scriptApi.logWarning("OSC frequency is not the same in all configurations in which the oscillator is used. Constant BOARD_XTAL0_CLK_HZ cannot be defined.");
    }
    var theSame = HwAbstr.isSettingSameInAllConfigurations("OSC_CR_SYS_OSC_CAP_LOAD_CFG", "osc");
    if (theSame != null && !theSame) {
      scriptApi.logWarning("OSC capacitors load is not the same in all configurations in which the oscillator is used.");
    }
    var theSame = HwAbstr.isSettingSameInAllConfigurations("RTC_CR_OSC_CAP_LOAD_CFG", "rtcUsed");
    if (theSame != null && !theSame) {
      scriptApi.logWarning("RTC capacitors load is not the same in all configurations in which RTC oscillator is used.");
    }
    for (var cfgIndex = 0; cfgIndex < Gen.configs.length; cfgIndex++) {
      var tempCfg = Gen.configs[cfgIndex];
      var theSame = HwAbstr.isSettingSameAsDefault(tempCfg, "MCG.FAST_IRCLK.outFreq", "fastIrclk", "asInteger");
      if (theSame != null && !theSame) {
        // scriptApi.logWarning(HwAbstr.getFastIrclkMsgIfDifferentFromDefault(tempCfg).log);  // Commented beacuse the function for setting the fast IRC frequencyis already supported in SDK.
      }
      var theSame = HwAbstr.isSettingSameAsDefault(tempCfg, "MCG.SLOW_IRCLK.outFreq", "slowIrclk", "asInteger");
      if (theSame != null && !theSame) {
        // scriptApi.logWarning(HwAbstr.getSlowIrclkMsgIfDifferentFromDefault(tempCfg).log);  // Commented beacuse the function for setting the slow IRC frequency is already supported in SDK.
      }
    }
  },
  
  
  /* Checks all configurations and reports errors, warnings and info.
   * return value - no data 
   */
  checkConfigurations: function() {
    for (var i = 0; i < Gen.configs.length; i++) {
      var tempCfg = Gen.configs[i];
      var powerMode = this.getPowerMode(tempCfg);
      var mcgMode = this.getMCGMode(tempCfg);
      if (!HwAbstr.isMcgLite()) {
        // BLPI or BLPE are not allowed for VLPR and VLPW
        if ((powerMode == "VLPR" || powerMode == "VLPW") && mcgMode != "BLPI" && mcgMode != "BLPE") {
          scriptApi.logError(tempCfg.getName() + " configuration: Entry to " + powerMode + " power mode is not allowed in " + mcgMode + " MCG mode.");
        }
      }
    }  
  },


  /* Checks if the setting is the same in all configurations where the setting exists and valid.
   * The validity is determined by second parameter
   * Parameter settingId - clock setting 
   * Parameter enableId - the setting of each configuration is checked only if this element is enabled  
   * Parameter getMethod - asInteger - getValueAsBigInteger function is used; otherwise getValueAsText is used 
   * return - true/false/null 
   */
  isSettingSameInAllConfigurations: function(settingId, enableId, getMethod) {
    var value = null;
    var result = true;
    for (var cfgIndex = 0; cfgIndex < Gen.configs.length; cfgIndex++) {
      var tempCfg = Gen.configs[cfgIndex];
      if (enableId == null || (HwAbstr.clockElementExist(tempCfg, enableId) && HwAbstr.isClockElementUsed(tempCfg, enableId))) {
        var setting = tempCfg.getValueAsText(settingId);
        if (setting != null) {
          if (getMethod == "asInteger") {
            setting = tempCfg.getValueAsBigInteger(settingId);
          }
          if (value == null) {
            value = setting;
          }
          else {
            if (!BigNumber.equal(value, setting)) {
              result = false;
            }
          }
        }
      } 
    }
    if (value == null) {
      return null;
    }
    return result;
  },
  
  
  /* Checks if the setting is the same as its default value
   * Parameter cfg - current configuration
   * Parameter settingId - clock setting 
   * Parameter enableId - the setting of each configuration is checked only if this element is enabled  
   * Parameter getMethod - asInteger - getValueAsBigInteger function is used; otherwise getValueAsText is used 
   * return - true/false/null 
   */
  isSettingSameAsDefault: function(cfg, settingId, enableId, getMethod) {
    if (enableId == null || (HwAbstr.clockElementExist(cfg, enableId) && HwAbstr.isClockElementUsed(cfg, enableId))) {
      var setting = cfg.getValueAsText(settingId);
      var defaultSetting = cfg.getDefaultValueAsText(settingId);
      if (setting != null && defaultSetting != null) {
        if (getMethod == "asInteger") {
          setting = cfg.getValueAsBigInteger(settingId);
          defaultSetting = cfg.getDefaultValueAsBigInteger(settingId);
        }
        if (BigNumber.equal(setting, defaultSetting)) {
          return true;
        }
        else {
          return false;
        }
      }
    }
    return null;
  },


  /* Gets message if FAST_IRCLK is dirrerent from its default value
   * Parameter cfg - current configuration
   * return - string[0] - message for scriptApi.logWarning; string[1] - message formatted for the code
   */
  getFastIrclkMsgIfDifferentFromDefault: function(cfg) {
    var result = new Array();
    var freq = SDKMapper.getFieldValue(cfg, "mcgliteConfig.fastIrclkFreq");
    var defaultFreq = SDKMapper.getFieldValue(cfg, "mcgliteConfig.fastIrclkFreqDefault");
    result.log = Gen.getConfigID(cfg)+ " function expects that the FAST_IRCLK is trimmed to non-default frequency " + freq.value + "Hz (default frequency: " + defaultFreq.value + "Hz).";
    result.code = new Array();
    result.code = result.code.concat("    /* Note: This function expects that the FAST_IRCLK is trimmed to non-default ");
    result.code = result.code.concat("             frequency " + freq.value + "Hz (default frequency: " + defaultFreq.value + "Hz). */");    
    return result;
  },


  /* Gets message if SLOW_IRCLK is dirrerent from its default value
   * Parameter cfg - current configuration
   * return - string["log"] - message for scriptApi.logWarning; string["code"] - message formatted for the code
   */
  getSlowIrclkMsgIfDifferentFromDefault: function(cfg) {
    var result = new Array();
    var freq = SDKMapper.getFieldValue(cfg, "mcgliteConfig.slowIrclkFreq");
    var defaultFreq = SDKMapper.getFieldValue(cfg, "mcgliteConfig.slowIrclkFreqDefault");
    result.log = Gen.getConfigID(cfg)+ " function expects that the SLOW_IRCLK is trimmed to non-default frequency " + freq.value + "Hz (default frequency: " + defaultFreq.value + "Hz).";
    result.code = new Array();
    result.code = result.code.concat("    /* Note: This function expects that the SLOW_IRCLK is trimmed to non-default ");
    result.code = result.code.concat("             frequency " + freq.value + "Hz (default frequency: " + defaultFreq.value + "Hz). */");    
    return result;
  },
    

  /* Get array of setting values for all configurations where the setting exists and valid.
   * The validity is determined by second parameter
   * Parameter settingId - clock setting 
   * Parameter enableId - the setting of each configuration is checked only if this element is enabled  
   * Parameter getMethod - asInteger - getValueAsBigInteger function is used; otherwise getValueAsText is used 
   * return - array of values 
   */
  getSettingValuesForAllConfigurations: function(settingId, enableId, getMethod) {
    var result = new Array();
    for (var cfgIndex = 0; cfgIndex < Gen.configs.length; cfgIndex++) {
      var tempCfg = Gen.configs[cfgIndex];
      if (enableId == null || (HwAbstr.clockElementExist(tempCfg, enableId) && HwAbstr.isClockElementUsed(tempCfg, enableId))) {
        var setting = tempCfg.getValueAsText(settingId);
        if (setting != null) {
          if (getMethod == "asInteger") {
            setting = tempCfg.getValueAsBigInteger(settingId);
          }
          var settingExist = false;
          for (var resIndex = 0; resIndex < result.length; resIndex++) {
            if (BigNumber.equal(result[resIndex], setting)) {
              settingExist = true;
            }
          }
          if (!settingExist) {
            result[result.length] = setting;
          }
        }
      } 
    }
    return result;
  },
  
  
  /**
   * Returns whether RTC is used
   *
   * @param cfg Clock configuration object
   * return value - true or false 
   */
  isRtcUsed: function(cfg) {
    return HwAbstr.isClockElementUsed(cfg, "rtcUsed");
  },
  
  
 /**
   * Returns whether RTC has its own oscillator or not
   *
   * return value - true or false 
   */
  hasRtcOwnOscillator: function() {
    return HwAbstr.clockElementExist(Gen.configs[0], "rtcExtalPin");
  },
  

 /**
   * Returns whether RTC has clock output to peripherals
   *
   * return value - true or false 
   */
  hasRtcOutputToPeripherals: function() {
    return HwAbstr.clockElementExist(Gen.configs[0], "rtcOut32kClk");
  },


 /**
   * Returns whether RTC should control enabling and capacity load in OSC
   *
   * @param cfg Clock configuration object
   * return value - true or false 
   */
  overrideOscSettingsByRtc: function(cfg) {
    return (cfg.getValueAsText("MCG_C2_OSC_MODE_CFG") == "RTCLowPower");  
  },

  
  /**
   * Check processor name and returns whether IRC48M needs to be enabled in USB
   *
   * @param gen Clock code generation object
   * return value - true for K60_1M or false for others 
   */
  irc48MEnableWorkaroundNecessary: function(gen) {
    var k60_1M = ["MK24FN1M0xxx12", "MK63FN1M0xxx12", "MK63FN1M0xxx12WS", "MK64FN1M0xxx12", "MK64FX512xxx12"];
    return (k60_1M.indexOf(gen.profile.getMcuInfo().getPartNumber()) != -1);
  },


  // Object which access element/component ids. It is used in function getBitFieldValue
  bitFields: {
      "usbphyPll" : ["USBPHY::PLL_SIC", "PLL_DIV_SEL"],
      "usbphyPfdFrac" : ["USBPHY::ANACTRL", "PFD_FRAC"],
      "usbphyPfdClkSel" : ["USBPHY::ANACTRL", "PFD_CLK_SEL"],
  },


  /**
   * Returns bit-field value
   *
   * @param cfg Clock configuration object
   * @param bitFieldId Bit-field id, see this.bitFields
   * return Bit-field value  
   */
  getBitFieldValue: function(cfg, bitFieldId) {
    var bitField = this.bitFields[bitFieldId];
    if (bitField == null) {
      scriptApi.logError("[DEBUG] Function HwAbstr.getBitFieldValue() doesn't support bit-field " + bitField);
      return -1; 
    }
    var value = cfg.getBitFieldValueAsBigInteger(bitField[0], bitField[1]);
    if (value == null) {
      scriptApi.logError("[DEBUG] Unknown value for " + bitField[0] + "[" + bitField[1] + "]"); 
    } 
    return (value);
  },
 
  // Object which access element/component ids. It is used in functions clockElementExist and isClockElementUsed
  clockIds: {
      "mcgPll" : "MCG.PLL",
      "fastIrclk" : "MCG.FAST_IRCLK",
      "slowIrclk" : "MCG.SLOW_IRCLK",
      "mcgLirc" : "MCG.LIRC",
      "osc" : "OSC.OSC",
      "oscErclkDiv" : "OSC.ERPS",
      "irc48MOsc" : "IRC48M.IRC48M",
      "usbphyPll" : "USBPHY.PLL",
      "usbPfdClk" : "USBPHY.USB1PFDCLK",
      "frdiv" : "MCG.FRDIV",
      "pllcs" : "MCG.PLLCS",
      "simOutDiv2" : "SIM.OUTDIV2",
      "simOutDiv3" : "SIM.OUTDIV3",
      "simPllFllSel" : "SIM.PLLFLLSEL",
      "simPllFllDiv" : "SIM.PLLFLLDIV",
      "simPllFllFrac" : "SIM.PLLFLLFRAC",
      "rtcExtalPin" : "RTC.EXTAL32.enable",  //it is not usable with isClockElementUsed function 
      "rtcClkIn" : "SIM.RTC_CLK_EXT_IN", 
      "rtc" : "RTC",
      "rtcOut32kClk" : "RTC.RTC32KCLK",
      "rtcOutClock" : "SIM.RTCCLKOUT",
      "rtcUsed" : "RTC.RTC1HzCLK",
      "usbFsClock" : "SIM.USB48MCLK",
      "usbSlowClock" : "SIM.USBSLCLK",
      "enet1588Clock" : "SIM.ENET1588TSCLK",
      "enetRmiiClock" : "SIM.RMIICLK",
      "sdhcClock" : "SIM.SDHCCLK",
      "lpuartClock" : "SIM.LPUARTCLK",
      "lpuart0Clock" : "SIM.LPUART0CLK",
      "lpuart1Clock" : "SIM.LPUART1CLK",
      "lpi2c0Clock" : "SIM.LPI2C0CLK",
      "lpi2c1Clock" : "SIM.LPI2C1CLK",
      "i2s0Mclk" : "SIM.I2S0_MOESEL",
      "flexioClock" : "SIM.FLEXIOCLK",
      "flexioS0Clock" : "SIM.FLEXIOS0SEL",
      "emvsimClock" : "SIM.EMVSIMCLK",
      "tpmClock" : "SIM.TPMCLK",
      "clkoutClock" : "SIM.CLKOUT",
      "traceFrac" : "SIM.TRACEFRAC",
      "traceDiv" : "SIM.TRACEDIV",
      "traceClock" : "SIM.TRACECLKIN",
      "copClock" : "SIM.COPCLK",
  },
  

  /**
   * Returns whether a clock element/component exists
   *
   * @param cfg Clock configuration object
   * @param id Setting id, see this.clockIds
   * return value - true or false 
   */
  clockElementExist: function(cfg, id) {
    if (cfg == null) {
      scriptApi.logError("[DEBUG] Function HwAbstr.clockElementExist() doesn't get right configuration (" + id + ")");
      return false; 
    }
    var settingId = this.clockIds[id];
    if (settingId == null) {
      scriptApi.logError("[DEBUG] Function HwAbstr.clockElementExist() doesn't support setting " + id);
      return false; 
    }
    return cfg.existsId(settingId);
  },
  

  /**
   * Returns whether a clock element is used
   *
   * @param cfg Clock configuration object
   * @param id Setting id, see this.clockIds
   * return value - true or false 
   */
  isClockElementUsed: function(cfg, id) {
    var settingId = this.clockIds[id];
    if (settingId == null) {
      scriptApi.logError("[DEBUG] Function HwAbstr.isClockElementUsed() doesn't support setting " + id);
      return false; 
    }
    settingId +=  ".enable";
    var setting = cfg.getValueAsText(settingId);
    if (setting == null) {
      scriptApi.logError("[DEBUG] Unknown id: " + settingId); 
      return false; 
    } 
    return (setting == "true");
  },
  

  /**
   * Returns whether FRDIV needs to be configured because of MCGFFCLK clock because FRDIV 
   * is not configured by CLOCK_BootTo*Mode() function.
   *
   * @param cfg Clock configuration object
   * return value - true or false 
   */
  frdivNotConfiguredByBootToXMode: function(cfg) {
    var mcgMode = HwAbstr.getMCGMode(cfg);
    if (HwAbstr.isClockElementUsed(cfg, "frdiv")) {
      if (mcgMode != "FEE" && mcgMode != "FBE") {
        return true;
      }
    }
    return false;
  } 
} // HwAbstr object prototype


