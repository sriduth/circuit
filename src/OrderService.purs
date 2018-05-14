module OrderService where

import Prelude ((<>))

type Amount = Int
type OrderId = String
type MerchantId = String

type TxnId = String

data Order = Order MerchantId OrderId Amount
data Transaction = Transaction TxnId OrderId

getOrderDetail :: MerchantId -> OrderId -> Order
getOrderDetail merchantId orderId = Order merchantId orderId 10 
  

getTransactionsForOrder :: Order -> Array Transaction
getTransactionsForOrder (Order _ orderId _) = [ Transaction ("txn_" <> orderId) orderId,
                                                Transaction ("txn_" <> orderId) orderId
                                              ] 
