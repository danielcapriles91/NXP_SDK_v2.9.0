##USB Host Use Cases

###General

Each preset and implementation code for a USB host share the same outside behavior. The generated implementation code enumerates the corresponding device and communicates with it. Results of this communication is printed on hosts debug console. 

All use cases require the user to copy the *Host task call* function call into the main loop of the program. You can retrieve this function call by pressing *Copy to clipboard* button next to *Host task call* label in config tool UI.

For example, the following source code should be placed in the main() function:

    while(1) 
    {
        USB_HostTasks();
    }  


##Supported Devices
Purpose of this use case is to serve as host for a device. In this use case, you must add interfaces to the *supported interfaces* array in the host for each device interface. The order of interfaces doesn't matter as long as each device interface has a host counterpart to service it.

The generated code is designated to support functionality provided by corresponding device presets.

For each code example the following files are generated:
* usb_host_<interface number>_<interface name>.h
* usb_host_<interface number>_<interface name>.c

PHDC example provides additional files:
* usb_host_phdc_ieee11073_nomenclature.h
* usb_host_phdc_ieee11073_nomenclature.c
* usb_phdc_ieee11073_types

