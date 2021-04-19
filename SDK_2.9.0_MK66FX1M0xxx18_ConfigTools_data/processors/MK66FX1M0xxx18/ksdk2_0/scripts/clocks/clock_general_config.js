/*
 * Copyright 2016 Freescale Semiconductor
 * Copyright 2016-2019 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */

// General configuration object 
// There are configuration items set to default values and below the object they can be changed for given processor
var GeneralConfig = {
  // sim_clock_config_t structure contains pllFllFrac and pllFllDiv items 
  // It is ignored if PLLFLLFRAC and PLLFLLDIV clock elements are not implemented on the chip in the SIM
  simPllFllFracDiv : true,
  
  // Use CLOCK_SetLpuart0Clock SDK function for settings LPUARTSRC selector (for LPUART0 clock) although SIM.LPUARTCLK (without index 0) clock element is in data (clocks/sim.xml/id="LPUARTCLK")
  // In most of processors, the default false is convenient - CLOCK_SetLpuart0Clock is for LPUART0SRC and CLOCK_SetLpuartClock is for LPUARTSRC 
  // It is ignored if LPUARTSRC selector is not implemented on the chip in the SIM
  useSetLpuart0ClockAlthoughLPUARTCLK : false,



}

// Reconfiguration of GeneralConfig items if their default values does not correspond on given processor
// Below there are supported all processors of SDK 2.0 release 1,2,3,4 

// Use CLOCK_SetLpuart0Clock SDK function for settings LPUARTSRC selector although SIM.LPUARTCLK (without index 0) clock element is in data (clocks/sim.xml/id="LPUARTCLK")
var MKS22Devices = ["MKS22FN128xxx12","MKS22FN256xxx12","MKS20FN128xxx12","MKS20FN256xxx12"];
if (MKS22Devices.indexOf(Gen.profile.getMcuInfo().getPartNumber()) != -1) {
  GeneralConfig.useSetLpuart0ClockAlthoughLPUARTCLK = true;
}

