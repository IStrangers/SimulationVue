import { isArray, isObject } from "../../shared"
import { createVnode, isVnode, Vnode } from "./vnode"

function h(type : any,propsOrChildren : any,children : any) : Vnode {
  const len = arguments.length
  if(len === 2) {
    if(isArray(propsOrChildren) || !isObject(propsOrChildren)) {
      return createVnode(type,null,propsOrChildren)
    }
    if(isVnode(propsOrChildren)) {
      return createVnode(type,null,[propsOrChildren])
    }
    return createVnode(type,propsOrChildren,null)
  } else {
    if(len > 3) {
      children = Array.from(arguments).splice(2)
    } else if(len === 3 && isVnode(children)){
      children = [children]
    }
    return createVnode(type,propsOrChildren,children)
  }
}

export {
  h
}