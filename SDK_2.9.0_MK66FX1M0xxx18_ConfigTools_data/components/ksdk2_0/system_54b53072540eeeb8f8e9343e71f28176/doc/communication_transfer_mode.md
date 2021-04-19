#Common transfer modes
Common transfer modes supported by communication components (e.g. I2C, SPI, UART etc.):
* **Polling** - Basic operation mode without using interrupts or transactional API of the SDK driver. In this mode all functionality is processed by checking flags and waiting loops.
* **Interrupt** - Operation mode when peripheral interrupts are used to generate events. All interrupt handlers (routines) have to be defined in user code. The interrupt handlers and transactional API of the SDK driver are not used.
* **Transfer** – Transactional operation mode when all functionality of the peripheral is wrapped by the SDK driver (initialization, run-time function, interrupt handlers). This mode supports transactional non-blocking operation (asynchronous transfers), callback functions and buffers for data transfers.
* **eDMA** – Transactional operation mode with DMA (Direct Memory Access) that provides initialization of the peripheral, DMA channels and transactional non-blocking API for data transfers (including callback functions and buffers). 
* **FreeRTOS** - Operation mode that supports RTOS API (e.g. FreeRTOS mode with transactional API). 

Notes:
* Some of the transfer modes may not be supported by specific component or by specific component mode.
* For details about transactional API and RTOS API provided by particular SDK driver please refer to the MCUXpresso SDK documentation.