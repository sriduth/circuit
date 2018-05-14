module Caching where

import Prelude (($))
import Data.Maybe (Maybe(..))
import Data.Tuple (Tuple(..))
import InvokeSpec (CallSpec(..),
                   Aspect(..),
                   FunctionInvocation)

foreign import getValue :: forall b. String -> CachedValue b
foreign import storeValue :: forall b. String -> b -> b 
foreign import generateKeyFromArgs :: forall a. a -> String

type CachedValue a = { value :: a, isOk :: Boolean}

cacheValue :: forall a b. String -> a -> b -> b
cacheValue funcName arguments valueToCache =
  let key = generateKeyFromArgs arguments in
  storeValue key valueToCache

getFromCache :: forall a b. String -> a -> Maybe b
getFromCache funcName arguments =
  let key = generateKeyFromArgs arguments in
  case getValue key  of
    { value: value, isOk: true} -> Just value
    _ -> Nothing
 

-- | Cache the return value of a function based on the arguments supplied.
-- TODO : Hashing scheme for arguments.
action :: forall a b.
          Aspect 
       -> CallSpec 
       -> FunctionInvocation a b
       -> FunctionInvocation a b       

action BeforeCall (CachingSpec spec) invocation =
  case invocation.arguments of
    Just arguments ->
      let previousResult = getFromCache "" arguments in
      invocation { result = previousResult }
    Nothing -> invocation

action AfterCall (CachingSpec spec) invocation =
  case Tuple invocation.result invocation.arguments of
    Tuple (Just result) (Just arguments) -> 
      let cachedResult = cacheValue "default" arguments result in
      invocation { result = Just $ cachedResult }
    _ -> invocation

action _ _ invocation = invocation 
