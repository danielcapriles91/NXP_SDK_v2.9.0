##USB Device Overview
This section provides the overview of device-mode settings.

###Supported Classes and Presets
The following classes and presets are supported in the USB device mode:
* Human Interface Device (HID) class
    * Keyboard
    * Mouse
    * Generic (both input and output)
* Communication Interface Class (CIC) & Data Interface Class (DIC)
    * CDC VCOM
* Device Firmware Upgrade (DFU) class
    * Application mode
    * Device Firmware Upgrade mode
* Mass Storage Class (MSC)
    * MSC RAM disk
* Personal Healthcare Device Class (PHDC)
    * PHDC Weight scale
* Printer class
    * Plain text printer
* Audio 1.0 class
    * Speaker

Presets can be extended to fulfill additional functions, by adding another interfaces.

###Device Role Configuration

**Vendor ID** and **Product ID** are used by host to identify device, host assigns device drivers to combination of these values.

**Manufacturer** and **Product** are values of string descriptors of corresponding names.

**Enable suspend and resume feature** enables generation of code responsible for suspend and resume functionality. Resulting code is generated in `usb_device_composite.c/.h` source files. Code generated when this option is enabled reflects functionality of SDK examples. These features are enabled only for selected processors, otherwise any settings for unsupported features are not visible.

**Enable remote wakeup feature** enables generation of code responsible for remote wakeup. Resulting code is generated in `usb_device_composite.c/.h` source files. In order  to add remote wakeup feature, it is necessary to configure an IRQ to wake up the device from low power mode entered by suspend.

**Remote wakeup call button** copies *RemoteWakeupTrigger()* function call to clipboard, this function should be called from interrupt service routine of any IRQ that wakes up device from low power mode and is supposed to send remote wakeup request.

**Max power** defines the maximum current the device is committed to consume. 

**Device task call** Copies *USB_DeviceTasks()* function call to clipboard, this function should be periodaclly called in program loop to service USB functionality.

**Supported interfaces** is an array of USB interfaces component will generate code to implement. Behavior of each interface depends on its class.

**Remaining endpoints** is a number of endpoints that can be added to the configuration. The limit depends on the hardware.

###Common Interface Settings

**Class** defines interface class.

**Custom interface name** is interface identifier for UI, generated filenames and code.

**Generate class implementation code** selects between code templates to use when generating, each template reflects behaviour of corresponding sdk example. When *None* option is selected then tools will not overwrite content of generated interface implementation file.

**Subclass** and **Protocol** are USB settings reflected in usb_device_descriptor.c/h files.

**Interface setting** allows you to define alternate interface setting.

**Custom setting name** is the setting identifier for UI, generated file names and code.
**Endpoints** allows you to set additional endpoints. Available endpoint setting may be dependent on a interface class limitations defined in USB specification.