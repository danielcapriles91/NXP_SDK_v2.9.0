/*
 * Copyright 2018-2020 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */
/**
 * Function to get processor specific information used in USB templates
 *
 * @param {String} pn MCU part number
 * @param {String} series MCU series
 * @param {String} peripheral Name of the selected peripheral
 * @returns {Object} parameters specific to the MCU
 */
function getProcessorSpecifics(pn, series, peripheral) {
	function getLpcControlerName(peripheral) {
		var controllerName = []
		
		if (peripheral === "USB0") {
			controllerName = ["lpc", "ip3511", "fs"];
		} else if (peripheral === "USBFSH") {
			controllerName = ["ohci"];
		} else if (peripheral === "USBHSD") {
			controllerName = ["lpc", "ip3511", "hs"];
		} else if (peripheral === "USBHSH") {
			controllerName = ["ip3516", "hs"];
		} else {
			scriptApi.logError("Peripheral " + peripheral + " is not supported by USB component on " + series + " MCUs.");
		}
		
		return controllerName;
	}
	
	var specifics = {
		mk64 : false,
		kinetis : false,
		lpc54xxx : false,
		lpc55xx : false,
		iMxRT1xxx : false,
		iMxRT6xx : false,
		iMxRTUsbCount : 2, 
		controllerName : "",
		controllerIdx : 0
	};

	switch(series) {
		case "Kinetis K":
		// fall-through
		case "Kinetis L":
			specifics.kinetis = true;
			if (peripheral === "USB0") {
				specifics.controllerName = "khci";
			} else if (peripheral === "USBHS") {
				specifics.controllerName = "ehci";
			} else {
				scriptApi.logError("Peripheral " + peripheral + " is not supported by USB component on " + series + " MCUs.");
			}
			break;
		case "LPC LPC54000":
			specifics.lpc54xxx = true;
			specifics.controllerName = getLpcControlerName(peripheral);
			break;
		case "LPC LPC5500":
			specifics.lpc55xx = true;
			specifics.controllerName = getLpcControlerName(peripheral);
			break;
		case "i.MX RT":
			if (peripheral === "USB" || peripheral === "USB1" || peripheral === "USB2") {
				specifics.controllerName = "ehci";
				specifics.iMxRT1xxx = true;
			} else {
				specifics.iMxRT6xx = true;
				// RT6xx has LPC USB peripherals
				specifics.controllerName = getLpcControlerName(peripheral);
			}
			
			if (peripheral === "USB2") {
				specifics.controllerIdx = 1;
			}
			break;
		default:
			scriptApi.logError("MCU series " + series + " is not supported by USB component.");
			break;
	}
	
	var nameRegex = /([a-zA-Z]+\d+).*/;
	nameMatch = nameRegex.exec(pn);
	
	switch (nameMatch[1])
	{
		case "MK64":
			specifics.mk64 = true;
			break;
        case "MIMXRT1011":
		case "MIMXRT1021":
			specifics.iMxRTUsbCount = 1;
			break;
	}
	
	return specifics;
}