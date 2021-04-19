##Peripheral Overview

The DMA controller enables you to move data from one memory-mapped location to another
without CPU involvement. Once configured and initiated, the DMA controller operates parallelly to the
Central Processing Unit (CPU), performing data transfers that would otherwise be handled by
the CPU. This results in a reduced CPU load and a corresponding increase in system performance.
Each eDMA controller channel can be independently configured to reflect the transfer sequence that is to be executed.
These eDMA controller channel settings are specified in the channel Transfer Control Descriptor (TCD) registers.

The eDMA module is partitioned into two major modules and their submodules:
- **eDMA engine** - Performs the source and destination address calculations and data movement operations.
    - Address path  
    - Data path  
    - Program model/channel arbitration  
    - Control  
- **Transfer-control descriptor local memory** - Contains transfer-control descriptors for each eDMA channel.
    - Memory controller  
    - Memory array  

eDMA transfers can be activated (requested) in 3 ways:
1. Events occurring in peripheral modules and off-chip can assert a DMA transfer request (for example, DMA or interrupt request).
2. Software activation (channel START bit, which is part of TCD).
3. Channel-to-channel linking on completion of a transfer (one channel activates request to another channel).

Each eDMA channel can generate interrupts to indicate that it has partially completed or fully completed a
transfer. Interrupts can also be generated to indicate that a transfer error has occurred.  

**Scatter-gather** processing is supported by every channel. This feature allows a channel to selfload a new TCD
when it has performed the transfer for its current configuration. Using this feature enables the definition and use of considerably greater 
transfer sequences than is the number of available eDMA channels.

### DMA Multiplexer (DMAMUX)

The eDMA module works in conjuction with the DMA multiplexer, which is used to route the numerous peripheral DMA sources to individual DMA channels.
Because of the mux the relation between any of the DMA request sources and a specific DMA channel is not hard-set. 
Each of the DMA channels can be independently enabled or disabled and associated with one of the DMA request source (peripheral request or always-on request) in the system.  

