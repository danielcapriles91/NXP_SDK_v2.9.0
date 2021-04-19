<?xml version="1.0"?>
<resource:resource_table xmlns:resource="http://swtools.freescale.net/XSD/resource/1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://swtools.freescale.net/XSD/resource/1.0 http://swtools.freescale.net/XSD/resource/1.0/resource.xsd" 
    id="generic_uart">
  <user_types>
    <struct id="uart_type" label="Uart type">
      <string id="peripheral_type" label="Peripheral type"/>
      <string id="peripheral_description" label="Peripheral description"/>
      <string id="sdk_driver_id" label="SDK driver ID"/>
      <string id="sdk_driver_filename" label="SDK driver filename"/>
      <string id="sdk_driver_prefix" label="SDK driver prefix"/>
      <string id="sdk_serial_manager_driver_id" label="SDK serial manager driver ID"/>
      <string id="sdk_serial_freemaster_id" label="SDK FreeMaster driver ID"/>
      <string id="sdk_freemaster_driver_filename" label="SDK FreeMaster driver filename"/>
      <string id="rx_signal_unified_id" label="Rx signal unified ID"/>
      <string id="rx_signal_description" label="Rx signal description"/>
      <string id="tx_signal_unified_id" label="Tx signal unified ID"/>
      <string id="tx_signal_description" label="Tx signal description"/>
      <string id="peripheral_clock_unified_id" label="Peripheral clock unified ID"/>
      <string id="peripheral_alias" label="Peripheral alias"/>
      <string id="peripheral_alias_index_feature_postfix" label="Peripheral alias"/>
    </struct>
  </user_types>
  <definition>
    <array id="uartList" label="Uart list" type="uart_type"/>
  </definition>
  <data>
    <array name="uartList">
      <struct name="0">
        <setting name="peripheral_type" value="UART0"/>
        <setting name="peripheral_description" value="LPSCI"/>
        <setting name="sdk_driver_id" value="platform.drivers.lpsci"/>
        <setting name="sdk_driver_filename" value="fsl_lpsci.h"/>
        <setting name="sdk_driver_prefix" value="LPSCI"/>
        <setting name="sdk_serial_manager_driver_id" value="component.lpsci_adapter"/>
        <setting name="sdk_serial_freemaster_id" value="FMSTR_SERIAL_MCUX_LPSCI"/>
        <setting name="sdk_freemaster_driver_filename" value="freemaster_serial_lpsci.h"/>
        <setting name="rx_signal_unified_id" value="uart_rx"/>
        <setting name="rx_signal_description" value="RX"/>
        <setting name="tx_signal_unified_id" value="uart_tx"/>
        <setting name="tx_signal_description" value="TX"/>
        <setting name="peripheral_clock_unified_id" value="UartClock"/>
        <setting name="peripheral_alias" value=""/>
        <setting name="peripheral_alias_index_feature_postfix" value=""/>
      </struct>
      <struct name="1">
        <setting name="peripheral_type" value="UART"/>
        <setting name="peripheral_description" value="UART"/>
        <setting name="sdk_driver_id" value="platform.drivers.uart"/>
        <setting name="sdk_driver_filename" value="fsl_uart.h"/>
        <setting name="sdk_driver_prefix" value="UART"/>
        <setting name="sdk_serial_manager_driver_id" value="component.uart_adapter"/>
        <setting name="sdk_serial_freemaster_id" value="FMSTR_SERIAL_MCUX_UART"/>
        <setting name="sdk_freemaster_driver_filename" value="freemaster_serial_uart.h"/>
        <setting name="rx_signal_unified_id" value="uart_rx"/>
        <setting name="rx_signal_description" value="RX"/>
        <setting name="tx_signal_unified_id" value="uart_tx"/>
        <setting name="tx_signal_description" value="TX"/>
        <setting name="peripheral_clock_unified_id" value="BusInterfaceClock"/>
        <setting name="peripheral_alias" value=""/>
        <setting name="peripheral_alias_index_feature_postfix" value=""/>
      </struct>
      <struct name="2">
        <setting name="peripheral_type" value="LPUART"/>
        <setting name="peripheral_description" value="LPUART"/>
        <setting name="sdk_driver_id" value="platform.drivers.lpuart"/>
        <setting name="sdk_driver_filename" value="fsl_lpuart.h"/>
        <setting name="sdk_driver_prefix" value="LPUART"/>
        <setting name="sdk_serial_manager_driver_id" value="component.lpuart_adapter"/>
        <setting name="sdk_serial_freemaster_id" value="FMSTR_SERIAL_MCUX_LPUART"/>
        <setting name="sdk_freemaster_driver_filename" value="freemaster_serial_lpuart.h"/>
        <setting name="rx_signal_unified_id" value="uart_rx"/>
        <setting name="rx_signal_description" value="RX"/>
        <setting name="tx_signal_unified_id" value="uart_tx"/>
        <setting name="tx_signal_description" value="TX"/>
        <setting name="peripheral_clock_unified_id" value="LpuartClock"/>
        <setting name="peripheral_alias" value=""/>
        <setting name="peripheral_alias_index_feature_postfix" value=""/>
      </struct>
      <struct name="3">
        <setting name="peripheral_type" value="USART"/>
        <setting name="peripheral_description" value="USART"/>
        <setting name="sdk_driver_id" value="platform.drivers.lpc_miniusart"/>
        <setting name="sdk_driver_filename" value="fsl_usart.h"/>
        <setting name="sdk_driver_prefix" value="USART"/>
        <setting name="sdk_serial_manager_driver_id" value="component.miniusart_adapter"/>
        <setting name="sdk_serial_freemaster_id" value="FMSTR_SERIAL_MCUX_MINIUSART"/>
        <setting name="sdk_freemaster_driver_filename" value="freemaster_serial_miniusart.h"/>
        <setting name="rx_signal_unified_id" value="usart_rxd"/>
        <setting name="rx_signal_description" value="RXD"/>
        <setting name="tx_signal_unified_id" value="usart_txd"/>
        <setting name="tx_signal_description" value="TXD"/>
        <setting name="peripheral_clock_unified_id" value="FunctionClock"/>
        <setting name="peripheral_alias" value=""/>
        <setting name="peripheral_alias_index_feature_postfix" value=""/>
      </struct>
      <struct name="4">
        <setting name="peripheral_type" value="FLEXCOMM"/>
        <setting name="peripheral_description" value="FLEXCOMM"/>
        <setting name="sdk_driver_id" value="platform.drivers.flexcomm_usart"/>
        <setting name="sdk_driver_filename" value="fsl_usart.h"/>
        <setting name="sdk_driver_prefix" value="USART"/>
        <setting name="sdk_serial_manager_driver_id" value="component.usart_adapter"/>
        <setting name="sdk_serial_freemaster_id" value="FMSTR_SERIAL_MCUX_USART"/>
        <setting name="sdk_freemaster_driver_filename" value="freemaster_serial_usart.h"/>
        <setting name="rx_signal_unified_id" value="usart_rxd"/>
        <setting name="rx_signal_description" value="RX"/>
        <setting name="tx_signal_unified_id" value="usart_txd"/>
        <setting name="tx_signal_description" value="TX"/>
        <setting name="peripheral_clock_unified_id" value="FXCOMFunctionClock"/>
        <setting name="peripheral_alias" value="USART"/>
        <setting name="peripheral_alias_index_feature_postfix" value="_USART_INDEX"/>
      </struct>
      <struct name="5">
        <setting name="peripheral_type" value="USART"/>
        <setting name="peripheral_description" value="USART"/>
        <setting name="sdk_driver_id" value="platform.drivers.vusart"/>
        <setting name="sdk_driver_filename" value="fsl_usart.h"/>
        <setting name="sdk_driver_prefix" value="USART"/>
        <setting name="sdk_serial_manager_driver_id" value="component.vusart_adapter"/>
        <setting name="sdk_serial_freemaster_id" value="FMSTR_SERIAL_MCUX_MINIUSART"/>
        <setting name="sdk_freemaster_driver_filename" value="freemaster_serial_miniusart.h"/>
        <setting name="rx_signal_unified_id" value="usart_rxd"/>
        <setting name="rx_signal_description" value="RXD"/>
        <setting name="tx_signal_unified_id" value="usart_txd"/>
        <setting name="tx_signal_description" value="TXD"/>
        <setting name="peripheral_clock_unified_id" value="FunctionClock"/>
        <setting name="peripheral_alias" value=""/>
        <setting name="peripheral_alias_index_feature_postfix" value=""/>
      </struct>
      <struct name="6">
        <setting name="peripheral_type" value="QSCI"/>
        <setting name="peripheral_description" value="QSCI"/>
        <setting name="sdk_driver_id" value="platform.drivers.qsci"/>
        <setting name="sdk_driver_filename" value="fsl_qsci.h"/>
        <setting name="sdk_driver_prefix" value="QSCI"/>
        <setting name="sdk_serial_manager_driver_id" value="component.qsci_adapter"/>
        <setting name="sdk_serial_freemaster_id" value="FMSTR_SERIAL_MCUX_QSCI"/>
        <setting name="sdk_freemaster_driver_filename" value="freemaster_serial_qsci.h"/>
        <setting name="rx_signal_unified_id" value="uart_rx"/>
        <setting name="rx_signal_description" value="RXD"/>
        <setting name="tx_signal_unified_id" value="uart_tx"/>
        <setting name="tx_signal_description" value="TXD"/>
        <setting name="peripheral_clock_unified_id" value="BusInterfaceClock"/>
        <setting name="peripheral_alias" value=""/>
        <setting name="peripheral_alias_index_feature_postfix" value=""/>
      </struct>
    </array>
  </data>
</resource:resource_table>