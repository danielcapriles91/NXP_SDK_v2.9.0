##Device firmware update
Device Firmware update class enables the field update of device firmware. *DFU* device has two modes:
* **Application mode** 
* **DFU mode**

##Application Mode
In this mode DFU interface can be used along with other usb interfaces as composite device. When DFU is prompted by software from host, device will change mode to DFU mode and re-enumerate with *DFU mode product ID*.

##DFU Mode 
By usb specification, in this mode device should not contain any other interface than DFU. This is the mode where downloading and manifestation of firmware takes place.

Device can begin its function already in DFU-mode, this is use case for device where USB interface serves solely the purpose of updating firmware.
