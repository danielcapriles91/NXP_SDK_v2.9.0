#Clock source configuration
Clock source configuration settings in MCUXpresso Peripherals tool component provides:
- Overview of the peripherals clock sources that are configured in the Clocks tool (see the Clock consumers overview in the Clocks tool).
- Information about clock source frequency used by other timing settings in the component.
- Initialization of the peripheral clock sources if supported by underlaying peripheral MCUXpresso SDK driver.

Typical clock source configuration consists from clock source selection and clock frequency selection:
- Clock source
    - Shows available clock sources for the peripheral that are provided from the Clocks tool (see available clock source of each peripheral in the Clock consumers overview in the Clocks tool).
    - For each available clock source, a list of all available Functional groups (from the Clocks tool) is also shown. For each Functional group (clock configuration), frequency of given clock source is visible or "Inactive" is shown in case that the clock source is not active in the Functional group.
    - Configuration of the clock source and Functional groups can be changed in the MCUXpresso Clocks tool.
- Clock source frequency
    - Specifies frequency of the selected clock source. 
    - It is possible to select frequency from a Functional group or to insert custom value. 
    - In case a custom value is used the component does not check that the clock source provides such frequency and it is up to application to guarantee that the correct frequency is provided during peripheral initialization.

Notes:
- It is application responsibility to initialize selected Functional group prior peripheral initialization in case more than one Functional group is used. The component only checks that the selected clock source is active in the selected Functional group.
- For details about Functional groups please refer to MCUXpresso Config Tools documentation.