module Main where

import Prelude

import Control.Monad.Free (foldFree, liftF)
import Control.Monad.Aff (launchAff)
import InvokeFunction (InvokeFunctionFC(..),
                       transform,
                       interpret)
import Unsafe.Coerce (unsafeCoerce)


getOrderDetails orderId = { orderId,
                            mercantId: "sriduth_sandbox_test",
                            status: "NEW",
                            amount: 1.00
                          }

--myProgram :: forall b. (FreeCommand String b) Unit
myProgram = do
  a <- liftF $ InvokeFunction getOrderDetails ("orderId") id
  b <- liftF $ InvokeFunction getOrderDetails ("orderId2") id
  _ <- liftF $ InvokeFunction getOrderDetails ("orderId") id
  _ <- unsafeCoerce $ liftF $ InvokeFunction (\a -> a) ("orderId2") id

  liftF $ End "Tests" unit

main = let tr = transform myProgram in
  launchAff $ foldFree interpret tr
