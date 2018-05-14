module RPCServer where


import Prelude (Unit)
import Control.Monad.Aff (Aff, runAff, Canceler(..))
import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Exception (Error)

foreign import deserialize :: forall a. String -> a


-- | To be called by the express router when it get the deserialzed request
-- the err and succ handlers provided are to be provided by the HTTP framework
-- in order to send the response to the caller.

runFunction :: forall a b e.
               a
               -> (a -> Aff e b)
               -> (Error -> Eff e Unit)
               -> (b -> Eff e Unit)
               -> Eff e (Canceler e)
               
runFunction arguments function err succ = runAff err succ (function arguments)  
