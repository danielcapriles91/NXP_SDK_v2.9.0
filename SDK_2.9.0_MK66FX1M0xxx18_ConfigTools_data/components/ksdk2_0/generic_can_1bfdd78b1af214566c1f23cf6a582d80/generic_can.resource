<?xml version="1.0"?>
<resource:resource_table xmlns:resource="http://swtools.freescale.net/XSD/resource/1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://swtools.freescale.net/XSD/resource/1.0 http://swtools.freescale.net/XSD/resource/1.0/resource.xsd" 
    id="generic_can">
  <user_types>
    <struct id="can_type" label="Can type">
      <string id="peripheral_type" label="Peripheral type"/>
      <string id="peripheral_description" label="Peripheral description"/>
      <string id="sdk_driver_id" label="SDK driver ID"/>
      <string id="sdk_driver_filename" label="SDK driver filename"/>
      <string id="sdk_driver_prefix" label="SDK driver prefix"/>
      <string id="sdk_freemaster_id" label="SDK FreeMaster driver ID"/>
      <string id="sdk_freemaster_driver_filename" label="SDK FreeMaster driver ID"/>
      <string id="rx_signal_unified_id" label="Rx signal unified ID"/>
      <string id="rx_signal_description" label="Rx signal description"/>
      <string id="tx_signal_unified_id" label="Tx signal unified ID"/>
      <string id="tx_signal_description" label="Tx signal description"/>
      <string id="peripheral_clock_1_unified_id" label="Peripheral clock unified ID"/>
      <string id="peripheral_clock_2_unified_id" label="Peripheral clock unified ID"/>
      <string id="peripheral_alias" label="Peripheral alias"/>
      <string id="peripheral_alias_index_feature_postfix" label="Peripheral alias"/>
    </struct>
  </user_types>
  <definition>
    <array id="canList" label="Can list" type="can_type"/>
  </definition>
  <data>
    <array name="canList">
      <struct name="0">
        <setting name="peripheral_type" value="CAN"/>
        <setting name="peripheral_description" value="FlexCAN"/>
        <setting name="sdk_driver_id" value="platform.drivers.flexcan"/>
        <setting name="sdk_driver_filename" value="fsl_flexcan.h"/>
        <setting name="sdk_driver_prefix" value="FLEXCAN"/>
        <setting name="sdk_freemaster_id" value="FMSTR_CAN_MCUX_FLEXCAN"/>
        <setting name="sdk_freemaster_driver_filename" value="freemaster_flexcan.h"/>
        <setting name="rx_signal_unified_id" value="can_rxd"/>
        <setting name="rx_signal_description" value="RX"/>
        <setting name="tx_signal_unified_id" value="can_txd"/>
        <setting name="tx_signal_description" value="TX"/>
        <setting name="peripheral_alias" value=""/>
        <setting name="peripheral_alias_index_feature_postfix" value=""/>
      </struct>
      <struct name="1">
        <setting name="peripheral_type" value="CAN"/>
        <setting name="peripheral_description" value="MCAN"/>
        <setting name="sdk_driver_id" value="platform.drivers.mcan"/>
        <setting name="sdk_driver_filename" value="fsl_mcan.h"/>
        <setting name="sdk_driver_prefix" value="MCAN"/>
        <setting name="sdk_freemaster_id" value="FMSTR_CAN_MCUX_MCAN"/>
        <setting name="sdk_freemaster_driver_filename" value="freemaster_mcan.h"/>
        <setting name="rx_signal_unified_id" value="can_rxd"/>
        <setting name="rx_signal_description" value="RX"/>
        <setting name="tx_signal_unified_id" value="can_txd"/>
        <setting name="tx_signal_description" value="TX"/>
        <setting name="peripheral_alias" value=""/>
        <setting name="peripheral_alias_index_feature_postfix" value=""/>
      </struct>
      <struct name="2">
        <setting name="peripheral_type" value="MSCAN"/>
        <setting name="peripheral_description" value="MSCAN"/>
        <setting name="sdk_driver_id" value="platform.drivers.mscan"/>
        <setting name="sdk_driver_filename" value="fsl_mscan.h"/>
        <setting name="sdk_driver_prefix" value="MSCAN"/>
        <setting name="sdk_freemaster_id" value="FMSTR_CAN_MCUX_MSCAN"/>
        <setting name="sdk_freemaster_driver_filename" value="freemaster_mscan.h"/>
        <setting name="rx_signal_unified_id" value="can_rxd"/>
        <setting name="rx_signal_description" value="RX"/>
        <setting name="tx_signal_unified_id" value="can_txd"/>
        <setting name="tx_signal_description" value="TX"/>
        <setting name="peripheral_alias" value=""/>
        <setting name="peripheral_alias_index_feature_postfix" value=""/>
      </struct>
        <struct name="3">
        <setting name="peripheral_type" value="CAN"/>
        <setting name="peripheral_description" value="FlexCAN"/>
        <setting name="sdk_driver_id" value="platform.drivers.dsc_flexcan"/>
        <setting name="sdk_driver_filename" value="fsl_flexcan.h"/>
        <setting name="sdk_driver_prefix" value="FLEXCAN"/>
        <setting name="sdk_freemaster_id" value="FMSTR_CAN_MCUX_DSCFLEXCAN"/>
        <setting name="sdk_freemaster_driver_filename" value="freemaster_flexcan_dsc.h"/>
        <setting name="rx_signal_unified_id" value="can_rxd"/>
        <setting name="rx_signal_description" value="RX"/>
        <setting name="tx_signal_unified_id" value="can_txd"/>
        <setting name="tx_signal_description" value="TX"/>
        <setting name="peripheral_alias" value=""/>
        <setting name="peripheral_alias_index_feature_postfix" value=""/>
      </struct>
    </array>
  </data>
</resource:resource_table>