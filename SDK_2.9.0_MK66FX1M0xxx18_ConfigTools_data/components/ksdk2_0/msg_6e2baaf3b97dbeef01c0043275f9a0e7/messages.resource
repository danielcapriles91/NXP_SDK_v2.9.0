<?xml version="1.0"?>
<resource:resource_table xmlns:resource="http://swtools.freescale.net/XSD/resource/1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://swtools.freescale.net/XSD/resource/1.0 http://swtools.freescale.net/XSD/resource/1.0/resource.xsd" 
    id="messages">
  <user_types>
    <struct id="message_type" label="Message">
      <string id="id" label="Message ID"/>
      <string id="msg" label="Message"/>
    </struct>
  </user_types>
  <definition>
    <array id="messageList" label="Message list" type="message_type"/>
  </definition>
  <data>
    <array name="messageList">
      <struct name="0">
        <setting name="id" value="err_routed_signal"/>
        <setting name="msg" value="Signal {0} of the peripheral {1} is not routed."/>
      </struct>
      <struct name="1">
        <setting name="id" value="err_routed_channel"/>
        <setting name="msg" value="Signal {0} of the channel {1} of the peripheral {2} is not routed."/>
      </struct>
      <struct name="2">
        <setting name="id" value="err_routed_signal_channel"/>
        <setting name="msg" value="Signal channel {0} of the peripheral {1} is not routed."/>
      </struct>
      <struct name="3">
        <setting name="id" value="err_missing_driver"/>
        <setting name="msg" value="The {0} driver is missing in the project{1}."/>
      </struct>
      <struct name="4">
        <setting name="id" value="err_driver_version"/>
        <setting name="msg" value="The compatible version of the {0} driver is not available in the project{1}."/>
      </struct>
      <struct name="5">
        <setting name="id" value="warn_dma_component"/>
        <setting name="msg" value="The DMA component must be in the default initialization function or in the current initialization function to provide DMA and DMAMUX devices initialization. Otherwise the DMA device will not work."/>
      </struct>
      <struct name="6">
        <setting name="id" value="warn_lpc_dma_component"/>
        <setting name="msg" value="The DMA component must be in the default initialization function or in the current initialization function to provide the DMA device initialization. Otherwise the DMA device will not work."/>
      </struct>
      <struct name="7">
        <setting name="id" value="warn_edma_component"/>
        <setting name="msg" value="The eDMA component must be in the default initialization function or in the current initialization function to provide eDMA and DMAMUX devices initialization. Otherwise the eDMA device will not work."/>
      </struct>
      <struct name="8">
        <setting name="id" value="err_signal_direction"/>
        <setting name="msg" value="Signal {0} of the peripheral {1} is not set to {3} direction."/>
      </struct>
      <struct name="9">
        <setting name="id" value="err_channel_direction"/>
        <setting name="msg" value="Signal {0} of the channel {1} of the peripheral {2} is not set to {3} direction."/>
      </struct>
      <struct name="10">
        <setting name="id" value="err_component_instance"/>
        <setting name="msg" value="Only one instance of the {0} component should be enabled."/>
      </struct>
    </array>
  </data>
</resource:resource_table>