/*
 * Copyright 2019 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */
 
function syncSwapIndexMapping_fce() {
  switch (child.getValue()) {
    case "TxRxTxRx":
      return 0;
    case "TxTxTxTx":
      return 1;
    case "RxRxRxRx":
      return 2;
    case "TxTxTxRx":
      return 3;
    case "RxRxTxRx":
      return 4;
    case "RxTxTxRx":
      return 5;
    case "RxRxTxTx":
      return 6;
    case "TxTxRxRx":
      return 7;
    default:                         
      return -1; 
  }
}

syncSwapIndexMapping_fce();