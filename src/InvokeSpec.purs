module InvokeSpec where

import Data.Maybe (Maybe(..))

-- Given a function, get its details
-- TODO : Require wrapper override to put the module name on the function object.
foreign import getFunctionDetails :: forall a b.
                                     (a -> b)
                                     -> { functionName :: String
                                        , moduleName :: String }

-- Given a function name and a module name, generate a list of call specs
-- that can be applied to the function
foreign import getFnCallSpec :: String
                                -> String
                                -> Array CallSpec

-- Specification on how to call functions
data CallSpec = CachingSpec
                { cacheTime :: Number }
              | LoggingSpec { logArgs :: Boolean
                            , logResult :: Boolean }
              | MetricsSpec { counter :: Boolean
                            , latency :: Boolean }
              | RPCSpec     { endpoint :: String
                            , retryCount :: Int }
              | HystrixSpec { maxLatencyTolerance :: Number
                            , maxHTTPError :: Int
                            , maxPendingTasks :: Int}
                
data Aspect = BeforeCall | AfterCall


-- Represent the data obtained around a fallible function call
type FunctionInvocation a b = { function :: (a -> b) 
                              , arguments :: Maybe a
                              , invokedAt :: Maybe Number
                              , result :: Maybe b
                              , resultAt :: Maybe Number
                              , externCallEndpoint :: Maybe String
                              , isHystrixManaged :: Boolean
                              }

emptyInvocation :: forall a b. (a -> b) -> FunctionInvocation a b
emptyInvocation function = { function: function
                           , arguments: Nothing
                           , invokedAt: Nothing
                           , result: Nothing
                           , resultAt: Nothing
                           , externCallEndpoint: Nothing
                           , isHystrixManaged: false
                           }
