module Test2 where

import Prelude

import Data.Foldable (foldr)
import Data.Maybe (Maybe(..))
import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Console (CONSOLE, logShow)
import Control.Monad.Free (Free, hoistFree, liftF)
import Unsafe.Coerce (unsafeCoerce)

-- type Node c = (forall a. {f :: (a -> b), args :: a}), rst :: (b -> c)}

-- type Node1 a b = {f :: (a -> b), args :: a}
-- data InvokeFunctionFC a b c = InvokeFunction (Node1 a b) (b -> c) | Done

-- -- Instance declaration for the InvokeFunction command
-- instance functionCommandF :: Functor (InvokeFunctionFC a b) where
--   map f (InvokeFunction a b) = InvokeFunction a (f <<< b)
--   map f (Done) = Done

-- -- Free command to be used by clients
-- type FreeCommand a b = Free (InvokeFunctionFC a b)

-- myProgram :: FreeCommand Unit
-- myProgram = do
--   _ <- liftF $ InvokeFunction {f: _.name, args: {name: "sriduth"}, rst: id}
--   _ <- liftF $ InvokeFunction {f: (\a -> a <> a), args: "Paul", rst: id}
--   pure $ liftF End "Program" unit

-- foo :: Node1 String
-- foo = {f: id, args : "f"}

-- Base data constructors for the Free Type
data InvokeFunctionFC a b c = InvokeFunction {f :: (a -> b), args :: a, rst :: (b -> c)} | Done

-- Instance declaration for the InvokeFunction command
instance functionCommandF :: Functor (InvokeFunctionFC a b) where
  map f (InvokeFunction i) = InvokeFunction i { rst = f <<< i.rst} --{f: i.f, args: i.args} -- i {rst = (f <<< i.rst)} -- {f: f, args: i.}f' a (f <<< r) --f' a (f <<< r)
  map f Done = Done

-- Free command to be used by clients
type FreeCommand a b = Free (InvokeFunctionFC a b) 

myProgram :: forall c. FreeCommand String String c
myProgram = do
  _ <- liftF $ InvokeFunction { f: id, args: "2", rst: id }
  _ <- unsafeCoerce $ liftF $ InvokeFunction { f: id, args: 2, rst: id }
  liftF $ Done
  --liftF $ End "Program" unit
