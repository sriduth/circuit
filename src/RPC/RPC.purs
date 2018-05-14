module RPC where

import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Exception (Error)
import Data.Maybe (Maybe(..))
import InvokeSpec (CallSpec(..),
                   Aspect(..),
                   FunctionInvocation)
import Prelude (($), Unit)

type RPCCallSpec a b e = { endpoint :: String
                         , args :: a
                         , errorCallback :: Error -> Eff e Unit
                         , successCallback :: b -> Eff e Unit
                         }
                         
-- | Given a function, arguments and purescript-aff#3.1.0 style error and success callback,
-- invoke the function as one would call a js function with the provided error and success callbacks

foreign import callRPC :: forall a b e. RPCCallSpec a b e -> Eff e Unit  

-- | Given an invocation specificication, check wether the function to be called
-- is a rest endpoint over the network, if so, then mark it as an asyncFunction
action :: forall a b.
          Aspect
          -> CallSpec
          -> FunctionInvocation a b
          -> FunctionInvocation a b

action BeforeCall (RPCSpec spec) invocation =
  invocation { externCallEndpoint = Just $ spec.endpoint }

action AfterCall _ invocation = invocation

action _ _ invocation = invocation




