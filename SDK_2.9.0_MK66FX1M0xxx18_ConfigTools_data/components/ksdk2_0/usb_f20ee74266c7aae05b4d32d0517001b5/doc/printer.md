##Printer
USB printers class is used by sending data on the bulk OUT endpoint. This data may take the form of PostScript, HP PCL, or any other PDL including plain text. The printer can respond periodically on the Bulk IN endpoint with status regarding the data it is receiving, or because of an asynchronous event.

##Interface
Bi-directional Interface. The bi-directional interface supports sending data to the printer via a Bulk OUT
endpoint, and receiving status and other information from the printer via a Bulk IN endpoint. Status data
that is compatible with a standard PC parallel port is also available when this interface is in use via the
GET_PORT_STATUS class-specific command over the default pipe.


