##Non-Transactional Mode

This section describes the use cases of eDMA non-transactional API mode for the following scenarios:

* Single transfer (API functions)
* Always on request (API functions)
* Single transfer (TCD structures)
* Scatter-gather (TCD structures)
* Channel linking (TCD structures)

All examples contain a demonstration of memory-to-memory transfer with disabled eDMA request using software trigger (except *Always on request* example). 
These examples can be easily modified by selecting the eDMA request to required peripheral (for example, UART, ADC, etc.)
which needs to be configured and initialized. The second option is to select *Always-on* request which transfers the data automatically without a software trigger 
(to avoid memory overflow in this mode enable **Auto-stop request**). In both cases enable **Peripheral request** to start the transfer. 



###Single Transfer (API functions)

This example describes the configuration of eDMA in non-transactional mode for a single software-triggered eDMA transfer. 
It demonstrates set-up for the TCD which is configured to transfer one data array `srcAddr[]`, to the destination array `dstAddr[]`.
The array consists of 8 blocks which are transferred by 4-Bytes within one major loop.

**1. Configure component as follows:**  
1. **Name** `DMA0` (component instance name for code-snippet examples)  
1. Use **preset:** `Non-transactional (API) - Single transfer`  
2. Edit **eDMA channel** *CH0*  
    1. **eDMA request** `Disable` or `DMAMUX disable`  
    2. Edit **Transfer configuration** *CH0_transfer*  
        1. Update source address configuration - **Data size [Byte]:** `4`  
        2. Update destination address configuration - **Data size [Byte]:** `4`  
        3. **Minor loop transfer [Byte]:** `32` (8x4-Byte blocks)  
        4. **Major loop transfer [Byte]:** `32` (8x4-Byte blocks)  
    3. Interrupt configuration is optional (the example does not demonstrate interrupt usage)

**2. Copy the following code into the variables section of the user code:**

*Note:* All used identifiers have to correspond with the peripheral configuration.  
Check the generated names, the update of the copied code might be required.  

---
>
    /* Variables */
    volatile uint32_t i;
>
    /* Source and destination buffers definitions */  
	/* 8 data blocks of 4-byte (32-bit) size */
    #define BUFF_LENGTH 8U
    AT_NONCACHEABLE_SECTION_INIT(uint32_t srcAddr[BUFF_LENGTH]) = {0x01U, 0x02U, 0x03U, 0x04U, 0x05U, 0x06U, 0x07U, 0x08U};  
    AT_NONCACHEABLE_SECTION_INIT(uint32_t dstAddr[BUFF_LENGTH]) = {0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U};  

---

**3. Copy the following code into the user main code:**

*Note:* All used identifiers have to correspond with the peripheral configuration.  
Check the names, the update of the copied code might be required.  

---

>
    PRINTF("\r\nDestination Buffer:\r\n");
    for (i = 0; i < BUFF_LENGTH; i++)
    {
        PRINTF("%d\t", dstAddr[i]);
    }
>
    /* Transfer start with software trigger */
    EDMA_TriggerChannelStart(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL);
>
    while ((EDMA_GetChannelStatusFlags(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL) & kEDMA_DoneFlag) == 0)
    {
    }
>
    PRINTF("\r\nDestination Buffer:\r\n");
    for (i = 0; i < BUFF_LENGTH; i++)
    {
        PRINTF("%d\t", dstAddr[i]);
    }

---

**4. Run the application**

###Always On Request (API functions)

This example describes the configuration of eDMA in non-transactional mode for a single eDMA transfer with *Always on*. 
It demonstrates set-up for the TCD which is configured to transfer one data array `srcAddr[]`, to the destination array `dstAddr[]`.
The array consist of 8 blocks which are transferred by 4-Bytes within one major loop. The peripheral request is enabled manually in user code,
otherwise the transfer would start immediately after the initialization due to always on request.  

**1. Configure component as follows:**  
1. **Name** `DMA0` (component instance name for code-snippet examples)
2. Use **preset:** `Non-transactional (API) - Single transfer`  
3. Edit **eDMA channel** *CH0*  
    1. **eDMA request** `#req: AlwaysOn XY` or `DMAMUX always on`  
    2. ** Peripheral request** `disabled`  (enabled in code after initialization)
    2. ** Auto stop request** ☑  
    2. Edit **Transfer configuration** *CH0_transfer* 
        1. Update source address configuration - **Data size [Byte]:** `4`  
        2. Update destination address configuration - **Data size [Byte]:** `4`  
        3. **Minor loop transfer [Byte]:** `32` (8x4-Byte blocks)  
        4. **Major loop transfer [Byte]:** `32` (8x4-Byte blocks)  
    3. Interrupt configuration is optional (the example does not demonstrate interrupt usage)

**2. Copy the following code into the variables section of the user code:**

*Note:* All used identifiers have to correspond with the peripheral configuration.  
Check the generated names, the update of the copied code might be required.  

---
>
    /* Variables */
    volatile uint32_t i;
>
    /* Source and destination buffers definitions */  
	/* 8 data blocks of 4-byte (32-bit) size */
    #define BUFF_LENGTH 8U
    AT_NONCACHEABLE_SECTION_INIT(uint32_t srcAddr[BUFF_LENGTH]) = {0x01U, 0x02U, 0x03U, 0x04U, 0x05U, 0x06U, 0x07U, 0x08U};  
    AT_NONCACHEABLE_SECTION_INIT(uint32_t dstAddr[BUFF_LENGTH]) = {0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U};  

---

**3. Copy the following code into the user main code:**

*Note:* All used identifiers have to correspond with the peripheral configuration.  
Check the names, the update of the copied code might be required.  

---

>
    PRINTF("\r\nDestination Buffer:\r\n");
    for (i = 0; i < BUFF_LENGTH; i++)
    {
        PRINTF("%d\t", dstAddr[i]);
    }
>
    /* Enables hardware peripheral (Always on) request */
    EDMA_EnableChannelRequest(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL);
>
    while ((EDMA_GetChannelStatusFlags(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL) & kEDMA_DoneFlag) == 0)
    {
    }
>
    PRINTF("\r\nDestination Buffer:\r\n");
    for (i = 0; i < BUFF_LENGTH; i++)
    {
        PRINTF("%d\t", dstAddr[i]);
    }

---

**4. Run the application**

###Single Transfer (TCD structures)

This example describes the configuration of eDMA in non-transactional mode for a single software-triggered eDMA transfer. 
It demonstrates set-up for the TCD which is configured to transfer one data array `srcAddr[]`, to the destination array `dstAddr[]`.
The array consist of 8 blocks which are transferred by 4-Bytes within one major loop.

**1. Configure component as follows:**  
1. **Name** `DMA0` (component instance name for code-snippet examples)
2. Use **preset:** `Non-transactional (TCD) - Single transfer`  
3. Edit **eDMA channel** *CH0*  
    1. **eDMA request** `Disable` or `DMAMUX disable`  
    2. Edit **TCD configuration** *CH0_TCD0*  
        1. Update source address configuration 
            - **Data size [Byte]:** `4`
        2. Update destination address configuration
            - **Data size [Byte]:** `4`
        3. **Minor loop transfer [Byte]:** `32` (8x4-Byte blocks)  
        4. **Major loop counts:** `1`
    3. Interrupt configuration is optional (the example does not demonstrate interrupt usage)

**2. Copy the following code into the variables section of the user code:**

*Note:* All used identifiers have to correspond with the peripheral configuration.  
Check the names, the update of the copied code might be required.  

---

>
    /* Variables */
    volatile uint32_t i;
>
    /* Source and destination buffers definitions */  
	/* 8 data blocks of 4-byte (32-bit) size */
    #define BUFF_LENGTH 8U
    AT_NONCACHEABLE_SECTION_INIT(uint32_t srcAddr[BUFF_LENGTH]) = {0x01U, 0x02U, 0x03U, 0x04U, 0x05U, 0x06U, 0x07U, 0x08U};  
    AT_NONCACHEABLE_SECTION_INIT(uint32_t dstAddr[BUFF_LENGTH]) = {0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U};  

---

**3. Copy the following code into the user main code:**

*Note:* All used identifiers have to correspond with the peripheral configuration.  
Check the names, the update of the copied code might be required.  

---

>
    PRINTF("\r\nDestination Buffer:\r\n");
    for (i = 0; i < BUFF_LENGTH; i++)
    {
        PRINTF("%d\t", dstAddr[i]);
    }
>
    /* Transfer start with software trigger */
    EDMA_TriggerChannelStart(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL);
>
    while ((EDMA_GetChannelStatusFlags(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL) & kEDMA_DoneFlag) == 0)
    {
    }
>
    PRINTF("\r\nDestination Buffer:\r\n");
    for (i = 0; i < BUFF_LENGTH; i++)
    {
        PRINTF("%d\t", dstAddr[i]);
    }

---

**4. Run the application**

###Scatter-Gather (TCD structures)

This example describes the configuration of eDMA in non-transactional mode for a software-triggered eDMA transfer with subsequent
scatter-gather mechanism at completion of the first major loop. It demonstrates different set-ups for the TCDs 
which are configured to transfer 2 data arrays `srcAddr0[]`, which is 16-byte size and `srcAddr1[]`, which is 8-byte size.

When the transfer is started by the software trigger, the first 32-bit (4-Byte) block of data in the
sequence is moved from the source to the destination. On completion of the first major loop, scatter-gather is 
performed and the data contained in the new TCD structure is loaded into the channel’s TCD. The next transfer is 
triggered automatically as the START bit is set when the new TCD is loaded. When this second transfer has completed, 
the channel is not used again, making it unnecessary to restore or prepare the channel for future transfers.
After all transfers are completed, the interrupt is invoked.

**1. Configure component as follows:**  
1. **Name** `DMA0` (component instance name for code-snippet examples)  
2. Use **preset:** `Non-transactional (TCD) - Scatter-gather`  
3. Edit **eDMA channel** *CH0*  
    1. **eDMA request** `Disable` or `DMAMUX disable`  
    2. Edit **TCD configuration** *CH0_TCD0*  
        1. Update source address configuration
            - **Data size [Byte]:** `4`
        2. Update destination address configuration
            - **Data size [Byte]:** `4`
        3. **Minor loop transfer [Byte]:** `16` (4x4-Byte blocks)  
        4. **Major loop counts:** `1`  
        5. **Interrupt sources:** `Major count completion`
    3. Edit **Transfer configuration** *CH0_TCD1*  
        1. Update source address configuration
            - **Data size [Byte]:** `4`
        2. Update destination address configuration
            - **Data size [Byte]:** `4`
        3. **Minor loop transfer [Byte]:** `8` (2x4-Byte blocks)  
        4. **Major loop counts:** `1`  
        5. **Interrupt sources:** `Major count completion`
    4. **Enable channel interrupt:** ☑  

**2. Copy the following code into the variables section of the user code:**

*Note:* All used identifiers (handlers, channels, etc.) have to correspond with the peripheral configuration.  
Check the generated names, the update of the copied code might be required.  

---

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
		volatile uint32_t i;
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
    /* Interrupt handler */
    void DMA0_DMA_CH_INT_DONE_0_IRQHANDLER(void) 
    {
		/* Clear interrupt flag */
		EDMA_ClearChannelStatusFlags(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL, kEDMA_InterruptFlag);
    }
	
---

**3. Copy the following code into the user main code:**

*Note:* All used identifiers have to correspond with the peripheral configuration.  
Check the names, the update of the copied code might be required.  

---
>
    /* Print initial state of buffers */
    printBuffers();
>
    /* Transfer start with software trigger - first transfer (TCD0) */
    EDMA_TriggerChannelStart(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL);
>
    /* Wait for the transfer completion */
    while ((EDMA_GetChannelStatusFlags(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL) & kEDMA_DoneFlag) == 0)
    {
    }
    /* Print destination buffers */
    printBuffers();
>
    /* Transfer start with software trigger - second transfer (TCD1) */
    EDMA_TriggerChannelStart(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL);
    /* Wait for the transfer completion and interrupt */
    while ((EDMA_GetChannelStatusFlags(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL) & kEDMA_DoneFlag) == 0)
    {
    }
    /* Print destination buffers */
    printBuffers();
  
---

**4. Run the application**

###Channel Linking (TCD structures)

This example describes the configuration of eDMA in non-transactional mode for a software-triggered eDMA transfer with channel link at the completion of the 
major loop. It demonstrates different set-ups for the TCDs which are configured to transfer 2 data arrays `srcAddr0[]` of channel 0, which is 16-byte
size and `srcAddr1[]` of channel 1, which is 8-byte size.  
When the channel performing the transfer is activated (by software trigger), the first 32-bit (4-Byte) block of data in the
sequence is moved from the source to the destination. On completion of the major loop of the first channel, the linked channel starts the transfer.
This transfer is triggered automatically. When this second transfer has completed, 
the channel is not used again, making it unnecessary to restore or prepare the channel for future transfers.
After all the transfers are completed, the interrupt is invoked.

**1. Configure component as follows:**  
1. **Name** `DMA0` (component instance name for code-snippet examples)  
2. Use **preset:** `Non-transactional (TCD) - Channel loops link`  
3. Edit **eDMA channel** *CH0*  
    1. **eDMA request** `Disable` or `DMAMUX disable`  
    2. Edit **TCD configuration** *CH0_TCD0*  
        1. Update source address configuration
            - **Data size [Byte]:** `4`
        2. Update destination address configuration
            - **Data size [Byte]:** `4`
        3. **Minor loop transfer [Byte]:** `16` (4x4-Byte blocks)  
        4. **Major loop counts:** `1`  
4. Edit **eDMA channel** *CH1*  
    1. **eDMA request** `Disable` or `DMAMUX disable`  
    2. Edit **TCD configuration** *CH1_TCD0*  
        1. Update source address configuration
            - **Data size [Byte]:** `4`
        2. Update destination address configuration
            - **Data size [Byte]:** `4`
        3. **Minor loop transfer [Byte]:** `8` (2x4-Byte blocks)  
        4. **Major loop counts:** `1`  
        5. **Interrupt sources:** `Major count completion`
    3. **Enable channel interrupt:** ☑  

**2. Copy the following code into the variables section of the user code:**

*Note:* All used identifiers have to correspond with the peripheral configuration.  
Please check the names, the update of the copied code might be required.  

---
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
		volatile uint32_t i;
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
    /* Channel 1 interrupt handler */
    void DMA0_DMA_CH_INT_DONE_1_IRQHANDLER(void) 
    {
		/* Clear interrupt flag */
		EDMA_ClearChannelStatusFlags(DMA0_DMA_BASEADDR, DMA0_CH1_DMA_CHANNEL, kEDMA_InterruptFlag);
    }

---

**3. Copy the following code into the user main code:**

*Note:* All used identifiers have to correspond with the peripheral configuration.  
Please check the names, the update of the copied code might be required.  

---
>
    /* Print initial state of buffers */
    printBuffers();
    /* Transfer (CH0) start with software trigger (second transfer (CH1) is linked) */
    EDMA_TriggerChannelStart(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL);
>
    /* Wait for the transfer completion and interrupt */
    while ((EDMA_GetChannelStatusFlags(DMA0_DMA_BASEADDR, DMA0_CH0_DMA_CHANNEL) & kEDMA_DoneFlag) == 0)
    {
    }
    while ((EDMA_GetChannelStatusFlags(DMA0_DMA_BASEADDR, DMA0_CH1_DMA_CHANNEL) & kEDMA_DoneFlag) == 0)
    {
    }
    /* Print destination buffers */
    printBuffers();
  
---

**4. Run the application**

