##Human Interface Device

Human interface device is a class suitable for sending small volumes of data at fixed intervals. HID interface supports only interrupt and control endpoints. The data are send in fixed-format structures called reports.

##Subclass

The purpose of subclass in HID class is solely to differentiate between devices that has BIOS support (Boot Interface Subclass) and devices that does not have BIOS support (No Subclass)

###Protocol

The *protocol* field of interface descriptor has meaning only if the *subclass* field has value of *boot interface subclass*, otherwise it is 0.
USB standard supports following protocols:
* None
* Keyboard
* Mouse

Protocols differ in expexted report structure, whereas in case of None the user is unrestriced when defining protocol.

###Keyboard Protocol

Keyboard consists of one IN endpoint, managing LEDs is done via control endpoint.

Default structure for keyboard report is as follows:
* Byte 0 : 	Modifier keys status, meaning of individual bits:
    0. Left Ctrl.
    1. Left Shift.
    2. Left Alt.
    3. Left GUI (Windows/Super key.)
    4. Right Ctrl.
    5. Right Shift.
    6. Right Alt.
    7. Right GUI (Windows/Super key.)
* Byte 1 : reserved
* Bytes 2-7 : keycodes of keys pressed or 0 
note: Host OS may consider individual positions of bytes 2-7 indifferently. 

###Mouse Protocol

Structure of mouse report is following:
* Byte 0 : each bit represents mouse button.
* Byte 1 : X axis.
* Byte 2 : Y axis.
* Byte 3 : Mouse wheel.


###None Protocol

This protocol is used to implement any device other than a mouse or keyboard.


