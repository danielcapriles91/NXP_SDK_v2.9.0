##Universal Serial Bus
USB is a fast bi-directional isochronous low-cost dynamically attachable serial interface that is an industry standard.
It provides a ubiquitous link that can be used across a wide range of peripheral-to-PC interconnects.
USB specification is maintained by the [USB Implementers Forum](https://www.usb.org/) (USB-IF).

###Prerequisites
Your copy of [SDK](http://kex-stage.freescale.net/en/welcome) must contain *"USB stack"* middleware for you to be able to build your USB project.

###Limitations
Adding this component to the project is only supported in MCUXpresso IDE.

###Configuration
A general process of creating a new USB device or USB host follows these steps:
* select the *Preset* closest to the desired *Device role*/*Host role*
* for each *Supported interface*, select the appropriate *Preset* and *Protocol*
* do *Update Project* and verify your project successfully builds
* press each *Copy to clipboard* button you encounter and paste clipboard contents as explained in the tool tip
* further customize component settings
* when done, set *Generate class implementation code* to *None* to disable code generation before modifying the code yourself

###Generated output
A *Custom class name* you specify is used to compose the interface implementation filename and in generated code (e.g. functions, types, and C preprocessor macros).
Every interface implementation source file goes into the project */source* folder.
Additional device and host configuration files, namely `usb_device_composite.c/.h`, `usb_host_app.c/.h`, `usb_device_config.h`, `usb_host_config.h`, `usb_device_descriptor.c/.h`, and `usb_host_common.h` are output into the project */source/generated* folder.
