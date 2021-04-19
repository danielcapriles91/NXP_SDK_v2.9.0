##Use cases

This section describes use cases for the implementation of the DMA transfer using the *Transactional* mode and both *Non-transactional* modes.
This introduction describes general component configuration use cases:  
- Transfer types - Configuration of DMA transfer mode regarding to the device type (Memory/Peripheral).
- TCD configuration - General component configuration of eDMA transfer control descriptor (TCD).

###Transfer types

The eDMA transfer source and destination exist in two types: memory or peripheral. The specific 
type affects the source and destination offset settings of the TCD structure. In case of memory the offset value needs to be set, otherwise the new
data rewrite the old data in the memory. The offset values in examples are represented by data block size of used source/destination address.  
Settings examples for the following transfer types:  

**Memory To Memory**
- Destination offset: `sizeof(dstAddr[0])` *- Destination address data block size*
- Source offset: `sizeof(srcAddr[0])` *- Source address data block size*
  
**Memory To Peripheral**
- Destination offset: `0`
- Source offset: `sizeof(srcAddr[0])`
  
**Peripheral To Memory**
- Destination offset: `sizeof(dstAddr[0])`
- Source offset: `0`
  
**Peripheral To Peripheral**
- Destination offset: `0`
- Source offset: `0`
  

###TCD configuration

Transfer control descriptors can be configured in all supported modes, but the configuration is slightly different.
In *transactional* and *non-transactional (API functions)* modes a transfer structure (`edma_transfer_config_t`) is configured. 
This structure configures the source and destination transfer attributes. Together with the use of API functions these modes provide partial 
configuration of the TCD registers.  
For full and direct configuration of TCDs use the *non-transactional (TCD structures)* API mode, which configures the whole TCD at once with direct
write to TCD registers. A TCD structure (`edma_tcd_t`) is configured in this mode.  
This example showcases a general TCD configuration in the framework of a *non-transactional (TCD structures)* mode. Other modes use equivalent settings 
to configure the TCD partially.

The transfer control descriptor configuration of eDMA channel for basic transfer:

**Configure component as follows:**

- **TCD ID:** `CH0_TCD0` (required, user-defined)
- **Enable scatter-gather:** `disabled` (optional, more than one TCD required)  
- **Source address configuration**  
    - **Address expression:** `&srcAddr0[0]` (required, user-defined)  
    - **External definition:** `uint32_t srcAddr0[]` (optional, defined in user code)  
    - **Offset expression:** `sizeof(srcAddr[0])` (user-defined)  
    - **External definition** (optional, user-defined)
    - **Data size [Byte]:** `4` (required, user-selected)  
    - **Modulo:** `Disabled modulo` (optional, user-selected)  
    - **Last address adjustment:** `-16` (optional, user-defined, e.g. 16-Byte for 4x[*Data size*])  
- **Destination address configuration**
    - **Address expression:** `&dstAddr0[0]` (required, user-defined)  
    - **External definition:** `uint32_t dstAddr0[]` (optional, defined in user code)  
    - **Offset expression:** `sizeof(dstAddr[0])` (user-defined)  
    - **External definition** (optional, user-defined)  
    - **Data size [Byte]:** `4` (required, user-selected)  
    - **Modulo:** `Disabled modulo` (optional, user-selected)  
    - **Last address adjustment:** `-16` (optional, user-defined, e.g. 16-Byte for 4x[*Data size*])  
- **Minor loop transfer [Byte]:** `16` (required, user-selected, e.g. minor loop of 4x4 Bytes)  
- **Minor loop offset:** (optional) `Disabled`  
- **Enable minor loop link:** `disabled` (optional)  
- **Enable major loop link:** `disabled` (optional)  
- **Major loop counts:** (required, user-defined) `1`
- **Bandwidth control:** `No eDMA engine stalls` (optional)  
- **Auto stop request:** (optional)  
- **Interrupt sources:** `disabled` Major count half completion `disabled` Major count completion (optional)  

**Copy the following code into the variables section of the user code:**

---

>  
    /* Example of buffers definitions by user */
>    
    /* Source address */
    AT_NONCACHEABLE_SECTION_INIT(uint32_t srcAddr0[4U]) = {0x01, 0x02, 0x03, 0x04};  
    /* Destination address */
    AT_NONCACHEABLE_SECTION_INIT(uint32_t dstAddr0[4U]) = {0x00, 0x00, 0x00, 0x00};  

---

