/*
 * Copyright 2019 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */
CONST = {
	SIZE_BYTE:0x08,
    AUDIO_SUBCLASS_NONE:0x00,
	AUDIO_SUBCLASS_AUDIOCONTROL:0x01,
	AUDIO_SUBCLASS_AUDIOSTREAM:0x02,
	CIC_SUBCLASS_ACM:0x02,
	AUDIO_PROTOCOL_NONE:0x00,
    AUDIO_PROTOCOL_IPV20:0x20,
	CIC_PROTOCOL_NONE:0x00,
	DIC_SUBCLASS_NONE:0x00,
	DIC_PROTOCOL_NONE:0x00,
	HID_SUBCLASS_NOSUBCLASS:0x00,
	HID_SUBLCASS_BOOT_INTERFACE:0x01,
	HID_PROTOCOL_NONE:0x00,
	HID_PROTOCOL_KEYBOARD:0x01,
	HID_PROTOCOL_MOUSE:0x02,
	HID_REPORTDESCRIPTOR_ITEM_ENDCOLLECTION:0xC0,
	MSC_SUBCLASS_SCSI:0x06,
	MSC_PROTOCOL_BBB:0x50,
	PHDC_SUBCLASS_NONE:0x00,
	PHDC_PROTOCOL_NONE:0x00,
	PRINTER_SUBCLASS_PRINTERS:0x01,
	PRINTER_PROTOCOL_BIDIRECTIONAL:0x02,
	USB_CLASS_MISCELLANEOUS:0xEF,
	USB_CLASS_AUDIO:0x01,
	USB_CLASS_CDC:0x02,
	USB_CLASS_CIC:0x02,
	USB_CLASS_DIC:0x0A,
	USB_CLASS_HID:0x03,
	USB_CLASS_MSC:0x08,
	USB_CLASS_PHDC:0x0F,
	USB_CLASS_PRINTER:0x07,
	USB_PROTOCOL_MISCELLANEOUS:0x01,
    USB_SUBCLASS_MISCELLANEOUS:0x02,
    USB_GET_LOW_BYTE_MACRO : "USB_SHORT_GET_LOW",
    USB_GET_HIGH_BYTE_MACRO : "USB_SHORT_GET_HIGH",
    USB_CLASS_APPLICATION_SPECIFIC:0xFE,
    APP_SPEC_SUBCLASS_DFU :0x01,
    APP_SPEC_PROTOCOL_DFU_APP:0x01,
    APP_SPEC_PROTOCOL_DFU_DFU:0x02,
};