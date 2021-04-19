/*
 * Copyright 2018 NXP
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
	var specifics = {
		mk64 : false,
		kinetis : false,
		lpc54xxx : false,
		iMxRT : false,
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
			if (peripheral === "USB0") {
				specifics.controllerName = ["lpc", "ip3511", "fs"];
			} else if (peripheral === "USBFSH") {
				specifics.controllerName = ["ohci"];
			} else if (peripheral === "USBHSD") {
				specifics.controllerName = ["lpc", "ip3511", "hs"];
			} else if (peripheral === "USBHSH") {
				specifics.controllerName = ["ip3516", "hs"];
			} else {
				scriptApi.logError("Peripheral " + peripheral + " is not supported by USB component on " + series + " MCUs.");
			}
			break;
		case "i.MX RT":
			specifics.controllerName = "ehci";
			specifics.iMxRT = true;
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
	}
	
	return specifics;
}