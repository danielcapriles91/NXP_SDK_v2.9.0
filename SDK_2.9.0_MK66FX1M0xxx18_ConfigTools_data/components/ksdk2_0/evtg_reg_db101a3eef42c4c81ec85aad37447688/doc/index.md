##Peripheral Overview

The EVTG (Event Generator) module consists of two parts: Two AND/OR/INVERT
(known simply as the AOI) modules and one configurable Flip-Flop. It supports the generation of a configurable number of EVENT signals. The two AOI combinational
expressions share the four associated EVTG inputs: A, B, C, and D. The Flip-Flop can be configured to make the two expressions act as the Reset port, Set port or D port,
CLK port or simply go through to EVTG output with FF (Flip-Flop) bypassed.  
This module is designed to be integrated in conjuction with one or more inter-peripheral crossbar switch (XBAR_DSC) modules. A crossbar switch is typically used to select the
4 EVTG inputs from among available peripheral outputs and GPIO signals. The EVTG outputs are typically used as additional inputs to a second crossbar switch, adding to it the
ability to connect to its outputs an arbitrary 4-input boolean function of its other inputs.  
This module is a slave peripheral module connecting event input indicators from a variety of device modules and generating event output signals that can be routed 
to an interperipheral crossbar switch or other peripherals. Its programming model is accessed through the standard IPS (Sky Blue) slave interface. 
The module is designed to be very configurable in terms of the integrated AOI functionality and Flip-Flop variety.

###AND/OR/INVERT Module

The AOI module provides a universal boolean function generator using a four-term sum
of products expression with each product term containing true or complement values of
the four selected event inputs (A, B, C, D). Specifically, the EVTG output is defined by
the following “4 x 4” boolean expression:
  
    EVTGn_AOIm (m=0,1)  
    = (0,An,~An,1) & (0,Bn,~Bn,1) & (0,Cn,~Cn,1) & (0,Dn,~Dn,1)    // product term 0  
    | (0,An,~An,1) & (0,Bn,~Bn,1) & (0,Cn,~Cn,1) & (0,Dn,~Dn,1)    // product term 1  
    | (0,An,~An,1) & (0,Bn,~Bn,1) & (0,Cn,~Cn,1) & (0,Dn,~Dn,1)    // product term 2  
    | (0,An,~An,1) & (0,Bn,~Bn,1) & (0,Cn,~Cn,1) & (0,Dn,~Dn,1)    // product term 3  
  
where each selected input term in each product term can be configured to produce a
logical 0 or 1 or pass the true or complement of the selected event input signal. Each product
term uses eight bits of configuration information, two bits for each of the four selected event inputs.
  
### EVTG Block Diagram

![Block_diagram](evtg_scheme.png)  