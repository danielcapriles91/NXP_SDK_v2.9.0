###Prerequisites
Your copy of [SDK](http://kex-stage.freescale.net/en/welcome) must contain *"USB stack"* middleware for you to be able to build your USB project.

###Limitations
Adding related SDK components into the toolchain project is available only in MCUXpresso IDE.

###Supported Modes
USB component can function in one of the following modes:
* [Device](device.md)
* [Host](host.md)

###Presets
Each mode offers a number of presets. Each **preset** is a separate use case. 
Presets are modeled after individual USB SDK examples. The generated code, 
when not modified by the user, results in behavior identical to the 
corresponding SDK example (except the board specific part of the application; 
for example sending audio data to audio codec on the board is not provided for the Audio speaker example).

##Generated output

This component splits the generated code into common and interface-specific code. 
Common code handles enumeration, device related requests and suspend and 
resume when supported. Interface requests are processed in the function 
implementation code, where each function has it's own source files.

A *Custom interface name* you specify is used to generate the interface 
implementation filename and labels in the generated code (for example 
functions, types, and C preprocessor macros). Every interface implementation 
source file is saved in the project's */source* folder. Additional device 
configuration files, for example `usb_device_composite.c/.h`, 
`usb_device_config.h` and `usb_device_descriptor.c/.h` are saved in the 
project's */source/generated* folder.