module Hystrix where

import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Exception (Error)
import InvokeSpec (Aspect(..), CallSpec(..), FunctionInvocation)
import Prelude (Unit)

-- | The hystrix `aspect` defined for a service must do the following:
-- 1) Allow circuit breaking based on the latency and error rate of a service.
-- 2) Specify when to begin allow of requests once the circuit breaker triggers

-- | Check if function can be called based on previous invocation data.
foreign import canCallFunction :: forall a b.
                                  FunctionInvocation a b
                                  -> Boolean

-- | For a given function invocation that makes a service call, get the success and error callbacks
-- provided by the aff module and wrap around them.
-- The wrapped callbacks should push the latency and http error code metrics details 
foreign import wrapServiceCall :: forall a e.
                                  (Error -> Eff e Unit)
                                  -> (a -> Eff e Unit)
                                  -> { wrappedErrorCallback :: (Error -> Eff e Unit)
                                       , wrappedSuccessCallback :: (a -> Eff e Unit)}
                                  

noWrapServiceCall :: forall a e.
                    (Error -> Eff e Unit)
                    -> (a -> Eff e Unit)
                    -> { wrappedErrorCallback :: (Error -> Eff e Unit)
                       , wrappedSuccessCallback :: (a -> Eff e Unit)}

noWrapServiceCall err succ = { wrappedErrorCallback: err
                             , wrappedSuccessCallback: succ}
                             
-- | Given an invocation specification, check wether the function should be called
-- based on the rate limiting rules if defined.
action :: forall a b.
          Aspect
          -> CallSpec
          -> FunctionInvocation a b
          -> FunctionInvocation a b

action BeforeCall (HystrixSpec spec) invocation = invocation { isHystrixManaged = true }

action _ _ invocation = invocation
