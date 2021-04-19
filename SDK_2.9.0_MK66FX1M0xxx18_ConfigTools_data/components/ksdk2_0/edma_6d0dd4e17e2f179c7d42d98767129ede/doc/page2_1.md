##Transactional Mode

This section describes two use cases of the eDMA transactional API mode for the following scenarios:
* Single transfer 
* Scatter-gather operation mode

Both examples contain a demonstration of memory-to-memory transfer with disabled eDMA request using software trigger (function `EDMA_TriggerChannelStart()`). 
These examples can be easily modified by selecting the eDMA request to required peripheral (for example, UART, ADC, etc.)
which needs to be configured and initialized. The second option is to select *Always-on* request which transfers the data automatically without a software trigger. 
In both cases enable **Peripheral request** to start the transfer.  

###Single Transfer

This example describes the configuration of eDMA in transactional mode for a single software-triggered eDMA transfer. 
It describes a setup for the TCD which is configured to transfer one data array `srcAddr[]`, to the destination array `dstAddr[]`.
The 32-Byte array consists of 8 blocks which are transfered by 4 minor loops of 4-Byte size (32-bit) within 2 major loops of 16-Byte size.

**1. Configure the component as follows:**  
1. **Name** `DMA0` (component instance name for code-snippet examples)
2. Use **preset:** `Transactional - Single transfer`  
3. Edit **eDMA channel** *CH0*
    1.  **eDMA request** `Disable` or `DMAMUX disable`  
    2. Edit **Transfer configuration** *CH0_TRANSFER0*  
        1. Update source address configuration - **Data size [Byte]:** `4`  
        2. Update destination address configuration - **Data size [Byte]:** `4`  
        3. **Minor loop transfer [Byte]:** `16` (4x4-Byte blocks within 2 major loops)  
        4. **Major loop transfer [Byte]:** `32` (8x4-Byte blocks)  
    3. Callback and interrupt configuration is optional (see Transactional - Scatter-gather preset)  

**2. Copy the following code into the variables section of the user code:**

*Note:* All used identifiers have to correspond with the peripheral configuration.  
Check the generated names, the update of the copied code might be required.  

---

>
    /* Source and destination buffers definitions */  
    /* 8 data blocks of 4-byte (32-bit) size */
    #define BUFF_LENGTH 8U
    AT_NONCACHEABLE_SECTION_INIT(uint32_t srcAddr[BUFF_LENGTH]) = {0x01U, 0x02U, 0x03U, 0x04U, 0x05U, 0x06U, 0x07U, 0x08U};  
    AT_NONCACHEABLE_SECTION_INIT(uint32_t dstAddr[BUFF_LENGTH]) = {0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U};  

---

**3. Copy the following code into the user main code:**

*Note:* All used identifiers have to correspond with the peripheral configuration.  
Check the generated names, update of the copied code might be required.  

---

>
    /* Counter variable */
    volatile uint32_t i;
>
    /* Print destination buffer initial state */
    PRINTF("\r\nDestination buffer:\r\n");
    for (i = 0; i < BUFF_LENGTH; i++)
    {
        PRINTF("%d\t", dstAddr[i]);
    }
>
    /* Start the transfer */  
    EDMA_StartTransfer(&DMA0_CH0_Handle);
    /* Start the first major loop transfer with software trigger*/  
    EDMA_TriggerChannelStart(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL);
    /* Start the second major loop transfer with software trigger*/  
    EDMA_TriggerChannelStart(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL);
>
    /* Wait for the first transfer completion */
    while((EDMA_GetChannelStatusFlags(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL) & kEDMA_DoneFlag) == 0)
    {
    }
>
    PRINTF("\r\nDestination buffer :\r\n");
    for (i = 0; i < BUFF_LENGTH; i++)
    {
        PRINTF("%d\t", dstAddr[i]);
    }

---

**4. Run the application**

###Scatter-Gather

This example describes the configuration of eDMA in transactional mode for a software-triggered eDMA transfer with subsequent
scatter-gather mechanism at completion of the first major loop. It describes different setups for the TCDs 
which are configured to transfer 2 data arrays `srcAddr0[]` which is 16-byte size and `srcAddr1[]` which is 8-byte size.  

When the transfer is started by the software trigger, the first 32-bit (4-Byte) block of data in the
sequence is moved from the source to the destination. On completion of the first major loop, scatter-gather is 
performed and the data contained in the new TCD structure is loaded into the channel's TCD. The next transfer is 
triggered automatically as the START bit is set when the new TCD is loaded. When this second transfer has completed, 
the channel is not used again, making it unnecessary to restore or prepare the channel for future transfers.
After all transfers are completed, the callback function is called.

**1. Configure the component as follows:**  
1. **Name** `DMA0` (component instance name for code-snippet examples)
2. Use **preset:** `Transactional - Scatter-gather`  
3. Edit **eDMA channel** *CH0*  
    1. **eDMA request** `Disable` or `DMAMUX disable`  
    2. Edit **Transfer configuration** *CH0_TRANSFER0*  
        1. Update source address configuration - **Data size [Byte]:** `4`  
        2. Update destination address configuration - **Data size [Byte]:** `4`  
        3. **Minor loop transfer [Byte]:** `16` (4x4-Byte blocks)  
        4. **Major loop transfer [Byte]:** `16` (4x4-Byte blocks)  
    3. Edit **Transfer configuration** *CH0_TRANSFER1*  
        1. Update source address configuration - **Data size [Byte]:** `4`  
        2. Update destination address configuration - **Data size [Byte]:** `4`  
        3. **Minor loop transfer [Byte]:** `8` (2x4-Byte blocks)  
        4. **Major loop transfer [Byte]:** `8` (2x4-Byte blocks)  

**2. Copy the following code into the variables section of the user code:**

*Note:* All used identifiers have to correspond with the peripheral configuration.  
Check the names, the update of the code might be required.  

---

>
    /* Variables  */
    volatile bool transferComplete = false;
    volatile uint32_t i;
>
    /* Source and destination buffers definitions */  
    /* 4 data blocks of 4-byte (32-bit) size */
    #define BUFF0_LENGTH 4U
	AT_NONCACHEABLE_SECTION_INIT(uint32_t srcAddr0[BUFF0_LENGTH]) = {0x01U, 0x02U, 0x03U, 0x04U};  
    AT_NONCACHEABLE_SECTION_INIT(uint32_t dstAddr0[BUFF0_LENGTH]) = {0x00U, 0x00U, 0x00U, 0x00U};  
    /* 2 data blocks of 4-byte (32-bit) size */
    #define BUFF1_LENGTH 2U
    AT_NONCACHEABLE_SECTION_INIT(uint32_t srcAddr1[BUFF1_LENGTH]) = {0x05U, 0x06U};  
    AT_NONCACHEABLE_SECTION_INIT(uint32_t dstAddr1[BUFF1_LENGTH]) = {0x00U, 0x00U};  
>
	/* Print destination buffers function */
	void printBuffers()
	{
		PRINTF("\r\nDestination 0 :\r\n");
		for (i = 0; i < BUFF0_LENGTH; i++)
		{
			PRINTF("%d\t", dstAddr0[i]);
		}
		PRINTF("\r\nDestination 1 :\r\n");
		for (i = 0; i < BUFF1_LENGTH; i++)
		{
			PRINTF("%d\t", dstAddr1[i]);
		}
	}
>
    /* Callback function */
    void DMA_callback(edma_handle_t *handle, void *param, bool transferDone, uint32_t tcds)
    {
        if (transferDone)
        {
            transferComplete = true;
        }
    }

---

**3. Copy the following code into the user main code:**

*Note:* All used identifiers have to correspond with the peripheral configuration.  
Check the names, the update of the copied code might be required.  

---

>
	/* Print initial state of destination buffers */
	printBuffers();
>
    /* Start transfer */  
    EDMA_StartTransfer(&DMA0_CH0_Handle);
>
    /* Transfer start with software trigger - first transfer */  
    EDMA_TriggerChannelStart(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL);
>
    /* Wait for the first transfer completion */
    while (transferComplete != true)
    {
    } 
	transferComplete = false;
	printBuffers();
>
    /* Transfer start with software trigger - second transfer */  
    EDMA_TriggerChannelStart(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL);
>
    /* Wait for the second transfer completion */
    while (transferComplete != true)
    {
    }
	transferComplete = false;
	printBuffers();

---

**4. Run the application**
