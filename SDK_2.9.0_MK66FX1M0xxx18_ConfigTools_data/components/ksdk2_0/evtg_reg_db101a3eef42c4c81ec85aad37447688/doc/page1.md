##Flip-Flop Mode Configuration

EVTG module inside implements different kinds of Flip-Flop for the generation of
desired EVTG output. The Flip-Flop can be configured as Bypass mode, RS trigger
mode, T-FF mode, D-FF mode, JK-FF mode, Latch mode.

###Bypass Mode

In this mode, filp-flop will be passed, The two AOI expressions **AOI_0** and **AOI_1**
will be directly assigned to EVTG outputs(**EVTG_OUTA** and **EVTG_OUTB**) .
In this mode, user can choose to enable or disable input sync logic and filter function.
Following diagram shows the disabled case(input sync and filter are removed from the
diagram).

![Bypass_mode](bypass.png)  

###RS Trigger Mode

In this mode, **AOI_0** expression is **Reset port**, and **AOI_1** is **Set port**. Both are active
high. When "R"(Reset) is high, whatever "S"(Set) is, EVTG_OUTA will be "0". When
"R" is low and "S" is high, EVTG_OUTA will be "1". If both "R" and "S" are low,
EVTG output will be kept. See the following figure.
EVTG_OUTB is always the complement of EVTG_OUTA.
In this mode, user can choose to enable or disable input sync logic and filter function.
Below diagram shows the disabled case(input sync and filter are removed from the
following diagram).

![RS-Mode](RS-FF.png)  

###T-FF Mode

In this mode, **AOI_0** expression is **T port** of T-FF, **AOI_1** is **CLK port**. When T assert,
the Q port (EVTG_OUTA) will turnover at the rising edge of "CLK". When T dis-assert,
Q(EVTG_OUTA) will be kept. See the following figure.
EVTG_OUTB is always the complement of EVTG_OUTA.
In this mode, input sync or filter has to be enabled to remove the possible glitch.

![T-FF](T-FF.png)  

###D-FF Mode

In this mode, **AOI_0** expression is **D port** of D-FF, **AOI_1** expression is **CLK port**. At the
rising edge of "CLK", D will be captured to Q (EVTG_OUTA). See the following figure.
EVTG_OUTB is always the complement of EVTG_OUTA.
In this mode, input sync or filter has to be enabled to remove the possible glitch.

![D-FF](D-FF.png)  

###JK-FF Mode

Here we implement the logic expression by AOI so that we can reuse the D-FF to
implement JK-FF. Suppose we set EVTG input "A" as "J" port, "C" as "K" port, "D"
as "CLK" port, and "Q" port of FF feed back and override "B", as shown in the
following figure. According to the JK logic expression, the **AOI_0** expression will be
**(A & ~B) | (B & ~C)**, **AOI_1** expression will be **D**.
In this mode, input sync or filter has to be enabled to remove the possible glitch.

![JK-FF](JK-FF.png)  

###Latch Mode

In this mode, **AOI_0** expression is **D port**, **AOI_1** is **CLK port**. Different from D-FF
mode, in Latch mode, D port will be passed only when CLK is high, and output will be
kept when CLK is low.
EVTG_OUTB is always the complement of EVTG_OUTA.
In this mode, input sync or filter has to be enabled to remove the possible glitch.

![Latch](Latch.png)  
  