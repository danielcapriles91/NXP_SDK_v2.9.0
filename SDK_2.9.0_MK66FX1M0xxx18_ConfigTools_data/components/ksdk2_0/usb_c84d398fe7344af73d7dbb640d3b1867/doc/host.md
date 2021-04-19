##USB Host Overview
This section provides an overview, of host-mode settings.

###Supported Classes and Presets
The following classes and presets are supported in the USB host mode:
* Human Interface Device
    * Keyboard
    * Mouse
    * Generic (both input and output)
* Communication Interface Class (CIC) & Data Interface Class (DIC)
    * CDC VCOM
* Personal Healthcare Device Class (PHDC)
    * PHDC Weight scale
* Printer class
    * Plain text printer

Presets can be extended to fulfill additional functions, by adding another interfaces.  
 
###Host Role Configuration

**Max power** - Defines the highest electrical current the host will support.

**Hub support** - Enables the hub-class driver to enable communication with hub.

**Supported interfaces** - A list of device interfaces supported by this host configuration. Each interface listed here represents a single interface instance. That means, to support two CDC devices, two pairs of CIC and DIC interfaces must be added. Interfaces added by host component may contain class specific settings, these settings mirrors the device functionality.