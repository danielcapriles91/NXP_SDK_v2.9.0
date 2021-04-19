###Component overview
This section and following subsections provide an overview of component settings in detail.

###Limitations
Adding related SDK components to the project is only supported in MCUXpresso IDE.

###Supported Modes

USB component can function in one of the following modes:
* Device
* Host

Each mode offers a number of presets. Each **preset** is a separate use case. Presets are modeled after individual USB SDK examples. The generated code, when not modified by the user, results in behavior identical to the corresponding SDK example.
##Generated output

This component splits the generated code into common and interface-specific. Common code handles enumeration, device related requests and suspend and resume when supported.
Interface requests are processed in the function implementation code, where each function has it's own source files.

A *Custom interface name* you specify is used to generate the interface implementation filename and labels in the generated code (for example functions, types, and C preprocessor macros).
Every interface implementation source file is saved in the project's */source* folder.
Additional device configuration files, for example `usb_device_composite.c/.h`, `usb_device_config.h` and `usb_device_descriptor.c/.h` are saved in the project's */source/generated* folder.
