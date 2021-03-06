/*
 * Copyright 2019 NXP
 * All rights reserved.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */

/***********************************************************************************************************************
 * This file was generated by the MCUXpresso Config Tools. Any manual edits made to this file
 * will be overwritten if the respective MCUXpresso Config Tools is used to update this file.
 **********************************************************************************************************************/

#ifndef _PIN_MUX_H_
#define _PIN_MUX_H_

/*!
 * @addtogroup pin_mux
 * @{
 */

/***********************************************************************************************************************
 * API
 **********************************************************************************************************************/

#if defined(__cplusplus)
extern "C" {
#endif

/*!
 * @brief Calls initialization functions.
 *
 */
void BOARD_InitBootPins(void);

#define SOPT5_UART0TXSRC_UART_TX 0x00u /*!<@brief UART 0 transmit data source select: UART0_TX pin */

/*! @name PORTC9 (coord D7), LEDRGB_RED
  @{ */
#define BOARD_LED_RED_GPIO GPIOC /*!<@brief GPIO device name: GPIOC */
#define BOARD_LED_RED_PORT PORTC /*!<@brief PORT device name: PORTC */
#define BOARD_LED_RED_PIN 9U     /*!<@brief PORTC pin index: 9 */
                                 /* @} */

/*! @name PORTE6 (coord E1), LEDRGB_GREEN
  @{ */
#define BOARD_LED_GREEN_GPIO GPIOE /*!<@brief GPIO device name: GPIOE */
#define BOARD_LED_GREEN_PORT PORTE /*!<@brief PORT device name: PORTE */
#define BOARD_LED_GREEN_PIN 6U     /*!<@brief PORTE pin index: 6 */
                                   /* @} */

/*! @name PORTA11 (coord L9), LEDRGB_BLUE
  @{ */
#define BOARD_LED_BLUE_GPIO GPIOA /*!<@brief GPIO device name: GPIOA */
#define BOARD_LED_BLUE_PORT PORTA /*!<@brief PORT device name: PORTA */
#define BOARD_LED_BLUE_PIN 11U    /*!<@brief PORTA pin index: 11 */
                                  /* @} */

/*! @name PORTB16 (coord E10), U7[4]/UART0_RX
  @{ */
#define BOARD_DEBUG_UART_RX_PORT PORTB /*!<@brief PORT device name: PORTB */
#define BOARD_DEBUG_UART_RX_PIN 16U    /*!<@brief PORTB pin index: 16 */
                                       /* @} */

/*! @name PORTB17 (coord E9), U10[1]/UART0_TX
  @{ */
#define BOARD_DEBUG_UART_TX_PORT PORTB /*!<@brief PORT device name: PORTB */
#define BOARD_DEBUG_UART_TX_PIN 17U    /*!<@brief PORTB pin index: 17 */
                                       /* @} */

/*! @name PORTA2 (coord K6), J9[6]/JTAG_TDO/TRACE_SWO/EZP_DO
  @{ */
#define BOARD_TRACE_SWO_PORT PORTA /*!<@brief PORT device name: PORTA */
#define BOARD_TRACE_SWO_PIN 2U     /*!<@brief PORTA pin index: 2 */
                                   /* @} */

/*!
 * @brief Configures pin routing and optionally pin electrical features.
 *
 */
void BOARD_InitPins(void);

#if defined(__cplusplus)
}
#endif

/*!
 * @}
 */
#endif /* _PIN_MUX_H_ */

/***********************************************************************************************************************
 * EOF
 **********************************************************************************************************************/
