##CDC VCOM 
Communication device class consist of two coupled interfaces of following classes:
* CIC - Communication interface class
* DIC - Data interface class

###Data Interface Class
This interface uses bulk endpoints in both directions to send communication data.

###Communication Interface Class
This interface contains one interrupt IN endpoint. This interface serves to communicate status notifications to host.
CIC is also used to emulate handshaking lines of COM port.






