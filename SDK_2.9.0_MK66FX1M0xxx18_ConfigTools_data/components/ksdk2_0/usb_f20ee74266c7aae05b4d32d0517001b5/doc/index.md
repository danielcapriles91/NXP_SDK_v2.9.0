##Universal Serial Bus
USB is a fast bi-directional isochronous low-cost dynamically attachable serial interface that is an industry standard.
It provides a ubiquitous link that can be used across a wide range of peripheral-to-PC interconnects.
USB specification is maintained by the [USB Implementers Forum](https://www.usb.org/) (USB-IF).

###Prerequisites
Your copy of [SDK](http://kex-stage.freescale.net/en/welcome) must contain *"USB stack"* middleware for you to be able to build your USB project.

###Limitations
Adding related SDK components works only in MCUXpresso IDE.

###Configuration
A general process of creating a new USB device or USB host follows these steps:
* Select the *Preset* closest to the desired *Device role*/*Host role*.
* Add any aditional interfaces if needed to implement desired functionality.
* For each *Supported interface* added, select the appropriate settings.
* Click *Update Project* to generate code.
* To avoid overwriting the modified class implementation files, select *Generate class implementation code* to None.
* Press each *Copy to clipboard* button you encounter and paste clipboard contents as explained in the tool tip.
* Further customize component settings.