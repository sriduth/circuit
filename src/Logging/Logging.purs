module Logging where

import Prelude (Unit)
import Data.Maybe (Maybe(..))
import InvokeSpec (CallSpec(..),
                   Aspect(..),
                   FunctionInvocation)

data LogTarget = LogToFile | LogToPapertrail

foreign import logAll :: forall a eff. a -> Unit

logToFile :: forall a. a -> Unit
logToFile  arguments = logAll arguments

logToPapertrail :: forall a. a -> Unit
logToPapertrail arguments = logAll arguments

doLog :: forall a. LogTarget -> a -> Unit
doLog action a = case action of
  LogToFile -> logToFile a
  LogToPapertrail -> logToPapertrail a
  

-- | Implements the logging action for the given arguments 
-- if none of the actions match, then simply return the invocation
-- data
action :: forall a b.
          Aspect 
       -> CallSpec 
       -> FunctionInvocation a b
       -> FunctionInvocation a b   

action BeforeCall (LoggingSpec spec) invocation =
  case invocation.arguments of
    Just arguments ->
      let val = doLog LogToFile invocation.arguments in
      invocation
    Nothing -> invocation

action AfterCall (LoggingSpec spec) invocation =
  case invocation.result of
    Just result ->
      let val = doLog LogToFile invocation.result in
      invocation
    Nothing -> invocation

action _ _ invocation = invocation
