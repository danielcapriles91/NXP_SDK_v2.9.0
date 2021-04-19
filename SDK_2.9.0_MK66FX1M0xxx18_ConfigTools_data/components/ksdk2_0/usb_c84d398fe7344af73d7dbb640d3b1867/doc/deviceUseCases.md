## USB Device Use Cases

### General

All use cases require you to copy the *Device task call* function call into the main loop of the program. You can retrieve this function by clicking the *Copy to clipboard* button next to *Device task call* label in the user interface.

For example, the following source code should be placed in the main() function:

    while(1) 
    {
        USB_DeviceTasks();
    }  

##Device Firmware Update

####Limitation
The generated code that handles the DFU functionality currently works only on selected development boards. A general requirement for generated DFU code to function is that the program code has to be stored in a RAM memory during execution. The example while downloading, stores the whole downloaded firmware in a specified portion of executable RAM memory and, upon finishing the download, it rewrites program counter to point onto memory holding newly downloaded firmware. Boards that support this code out of the box:
* MIMXRT-1050
* MIMXRT-1020
* MIMXRT-1060
* MIMXRT-1064
* LPCXpresso54608
* FRDM-MKL27Z

###App-Idle
Starting the device in app-idle mode enables the implementation of additional USB interfaces into the composite device.

###DFU-Idle
Starting the USB device directly in the DFU mode is a suitable use case when USB implements only the DFU interface.

The code example is generated in the device interface files:
* usb_device_<interface number>_<interface name>.h
* usb_device_<interface number>_<interface name>.c
* usb_device_<interface number>_<interface name>_app.h
* usb_device_<interface number>_<interface name>_app.c
* usb_flash.h
* usb_dfu_ram.c
* timer_queue.c
* timer_queue.h

###Class Specific Settings

**DFU mode product ID** is required to differentiate the DFU-mode enumeration from application-mode enumeration. This is the product ID used for enumeration in DFU mode and is used to ensure that the host will not enumerate the device as if in application mode.

**Firmware destination address and firmware maximum write size**, 
when selecting these values, considerations have to be made about size and location of currently running code, selected location should not overlap any used part of memory or memory border and should be an executable memory section.

##Human Interface Device

###HID Keyboard
The code example is a simple demonstration of HID-compliant keyboard device. When connected to host the Page Up and Page Down key strokes are sent to host.
When the *kUSB_DeviceHidEventSendResponse* event occurs, the *USB_DeviceHidKeyboardAction* function is called. This functions prepares sending buffer by writing into *s_UsbDeviceHidKeyboard.buffer* and then calls *USB_DeviceHidSend* function to send the data in the buffer. The fact that byte 2 of sending buffer is being written to reflects the structure of the keyboard protocol report structure send in each packet.

The code example is generated in the device interface file:
* usb_device_<interface number>_<interface name>.c


###HID Mouse
The code example is a simple demonstration of HID-compliant mouse device. When connected to host the mouse arrow is moving rectangularly on the screen.
The only differences in implementation code between keyboard and mouse is different report structure and resulting behavior.

The code example is generated in the device interface file:
* usb_device_<interface number>_<interface name>.c

###HID Generic Implementation Code

This implementation by default receives data and then sends copy of those data back to host. This provides a simple starting point for device that receives data from host. This is triggered by *kUSB_DeviceHidEventRecvResponse* event, this event is called when transaction from host occurs.

The code example is generated in the device interface file:
* usb_device_<interface number>_<interface name>.c

###Class Specific Settings

**Report descriptor table** enables the editing of the report descriptor. Negative values can be entered in decimal format or in 32-bit hexadecimal format, even if the minimum value requires less bits. E.g. when a value range is limited to 8bit number, -128 must be entered either as -128 or as 0xFFFFFF80. The generated value is optimized for the lowest possible number of bits.

##CDC VCOM
The Virtual COM project is a simple demonstration of a device that is enumerated as a COM port, which the users can open using terminal tools, such as TeraTerm. 
The demo echoes back any character it receives. The purpose of this demo is to show how to build a device of USB CDC class and to provide a simple project for further
development.

*DIC* class interface code is not generated into separate file, instead *DIC* functionality is implemented inside the generated output file of *CIC* interface.

The implementation code sends back any incoming characters received from host to confirm data acceptance.

The code example is generated in the device interface files:
* usb_device_<interface number>_<interface name>.h
* usb_device_<interface number>_<interface name>.c

###Class Specific Settings

**Succeeding data transmission  interfaces** - The number of *DIC* class interfaces controlled by this interface

##MSC RAM Disk

The generated implementation code results in the device becoming visibile as storage volume upon enumeration.
The generated implementation code stores data in RAM, causing the state of the resulting drive non-persistent.

The code example is generated in the device interface file:
* usb_device_<interface number>_<interface name>.c

##Printer Plain Text

The generated implementation code prints any received raw data to the debug console.

The code example is generated in the device interface files:
* usb_device_<interface number>_<interface name>.h
* usb_device_<interface number>_<interface name>.c

##PHDC Weight Scale

The implementation provides an application simulating a weight scale sending weight and Body Mass Index (BMI) information. The information exchange is based on the IEEE 11073 standard.

The code example is generated in the device interface files:
* usb_device_<interface number>_<interface name>.h
* usb_device_<interface number>_<interface name>.c
* usb_device_<interface number>_<interface name>_shim_agent.h
* usb_device_<interface number>_<interface name>_shim_agent.c
* usb_device_phdc_ieee11073_agent.c
* usb_device_phdc_ieee11073_agent.h
* usb_phdc_ieee11073_types.h
* timer_queue.c
* timer_queue.h

##Audio 1.0 speaker

Audio 1.0 speaker code example that is enumerated as a playback device. The audio data are received by the device and stored in the internal buffer. The playback of audio data is not part of the code example. 

The code example is generated in the device interface files:
* usb_device_<interface number>_<interface name>.h
* usb_device_<interface number>_<interface name>.c