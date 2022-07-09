import { patchProp } from "../../runtime-dom/src/patchProp"
import { ShapeFlags } from "../../shared"
import { createRenderApi } from "./renderApi"
import { isSameVnode, Vnode } from "./vnode"

enum ContainerTagAttr {
  VNODE = "__vnode__"
}

function createRenderer(renderOptions : any) {

  const {
    hostCreateText,
    hostCreateElement,
    hostInsert,
    hostSetElementText,
    hostRemove,
    hostPatchProps,
  } = createRenderApi(renderOptions)



  function mountChildren(children : Array<Vnode>,container : Node) {
    for(let i = 0; i < children.length; i++) {
      mountELement(children[i],container,null)
    }
  }



  function mountELement(vnode : Vnode,container : Node,anchor : Node | null) {
    const {type,props,shapeFlag,children} = vnode
    let el = type ? hostCreateElement(type) : container
    if(props) {
      hostPatchProps(el,{},props)
    }
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostInsert(hostCreateText(children),el)
    }else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children,el)
    }
    if(type) {
      hostInsert(el,container,anchor)
    }
    vnode.el = el
    el[ContainerTagAttr.VNODE] = vnode
  }
  


  function patchKeyChildren(oldChildren : Array<Vnode>,newChildren : Array<Vnode>,el : Node) {
    let i = 0
    let oldLength = oldChildren.length - 1
    let newLength = newChildren.length - 1

    while(i <= oldLength && i <= newLength) {
      const oldVnode = oldChildren[i]
      const newVnode = newChildren[i]
      if(isSameVnode(oldVnode,newVnode)) {
        patch(oldVnode,newVnode,el,null)
      } else {
        break
      }
      i++
    }

    while(i <= oldLength && i <= newLength) {
      const oldVnode = oldChildren[oldLength]
      const newVnode = newChildren[newLength]
      if(isSameVnode(oldVnode,newVnode)) {
        patch(oldVnode,newVnode,el,null)
      } else {
        break
      }
      oldLength--
      newLength--
    }

    if(i > oldLength) {
      while(i <= newLength) {
        const nextNewIndex = newLength + 1
        const anchor = nextNewIndex < newChildren.length ? newChildren[nextNewIndex].el : null
        patch(null,newChildren[i],el,anchor)
        i++
      }
    } else if(i > newLength) {
      while(i <= oldLength) {
        unmount(oldChildren[i])
        i++
      }
    }

    //乱序对比
    const keyTonewIndexMap = new Map()
    for(let j = i; j <= newLength; j++) {
      keyTonewIndexMap.set(newChildren[j].key,j)
    }
  
    const toBePatched = newLength - i
    //是否比较过
    const hasItBeenComparedMap = new Array(toBePatched > 0 ? toBePatched : 1).fill(0)
    //老的元素在新的里面有没有，如果有就要比较差异，没有就要添加，老的有新的没有就删除
    for(let j = i; j <= oldLength; j++) {
      const oldVnode = oldChildren[j]
      const newIndex = keyTonewIndexMap.get(oldVnode.key)
      if(newIndex) {
        patch(oldVnode,newChildren[newIndex],el,null)
        //标记
        hasItBeenComparedMap[newIndex - i] = j + 1
      } else {
        unmount(oldVnode)
      }
    }

    //需要移动的元素
    for(let j = toBePatched; j >= 0; j--) {
      const index = j + i
      const current = newChildren[index]
      const anchor = (index + 1) < newChildren.length ? newChildren[index + 1].el : null
      
      //是否是创建的元素
      if(hasItBeenComparedMap[j] === 0) {
        patch(null,current,el,anchor)
      } else {
        //移动位置
        hostInsert(current.el,el,anchor)
      }
    }
  }



  function patchChildren(oldVnode : Vnode,newVnode : Vnode,el : Node) {
    const oldChildren = oldVnode.children
    const newChildren = newVnode.children

    const oldShapeFlag = oldVnode.shapeFlag
    const newShapeFlag = newVnode.shapeFlag

    //如果新的是文本
    if(newShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //如果老的是数组
      if(oldShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(oldChildren)
      }
      if(oldChildren !== newChildren) {
        hostSetElementText(el,newChildren)
      }
    } else {
      //如果老的是数组
      if(oldShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        //如果新的是数组
        if(newShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          patchKeyChildren(oldChildren,newChildren,el)
        } else {
          unmountChildren(oldChildren)
        }
      } else {
        //如果老的是文本
        if(oldShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el,"")
        }
        //如果新的是数组
        if(newShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(newChildren,el)
        }
      }
    }
  }



  function patchElement(oldVnode : Vnode,newVnode : Vnode) {
    if(!oldVnode.el) {
      return
    }
    let el = (newVnode.el = oldVnode.el)
    const oldProps = oldVnode.props || {}
    const newProps = newVnode.props || {}
    hostPatchProps(el,oldProps,newProps)
    patchChildren(oldVnode,newVnode,el)
  }



  function patch(__vnode__ : Vnode | null,vnode : Vnode,container : Node,anchor : Node | null) {   
    if(__vnode__ === vnode) {
      return
    }

    if(__vnode__ && !isSameVnode(__vnode__,vnode)) {
      unmount(__vnode__)
      __vnode__ = null
    }
  
    if(__vnode__) {
      patchElement(__vnode__,vnode)
    } else {
      mountELement(vnode,container,anchor)
    }
  
  }
  


  function unmount(vnode : Vnode) {
    hostRemove(vnode.el)
  }



  function unmountChildren(childrenVnode : Array<Vnode>) {
    for(let i = 0; i < childrenVnode.length; i++) {
      unmount(childrenVnode[i])
    }
  }



  function render(vnode : Vnode | null,container : Node) {
    const __vnode__ = container[ContainerTagAttr.VNODE] || null
    if(vnode) {
      patch(__vnode__,vnode,container,null)
      container[ContainerTagAttr.VNODE] = vnode
    } else if(__vnode__){
      unmount(__vnode__)
    }
  }



  return {
    render
  }

}

export {
  createRenderer
}