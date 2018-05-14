module Counters where

import Prelude

import Data.Maybe (Maybe(..))
import InvokeSpec (CallSpec(..),
                   Aspect(..),
                   FunctionInvocation)

foreign import getTimestamp :: Unit -> Number
foreign import getFunctionName :: forall a b. (a -> b) -> String
foreign import increment :: String -> Unit
foreign import latency :: String -> Number -> Unit
  
incrementFunctionCallCount :: String -> Unit
incrementFunctionCallCount functionName = increment functionName  


-- | Perform the metric actions : Latency measure and call count 
action :: forall a b.
          Aspect 
       -> CallSpec 
       -> FunctionInvocation a b
       -> FunctionInvocation a b   

action BeforeCall (MetricsSpec spec) invocation =
  let val =  increment (getFunctionName invocation.function)
      invokedAt = getTimestamp unit
  in
   invocation { invokedAt = Just $ invokedAt }

action AfterCall (MetricsSpec spec) invocation =
  case invocation.invokedAt of
    Just invokedAt -> 
      let resultAt = getTimestamp unit
          callLatency = resultAt - invokedAt
          val = latency (getFunctionName invocation.function) callLatency
      in
       invocation { resultAt = Just $ callLatency }
    Nothing -> invocation
    
action _ _ invocation = invocation
