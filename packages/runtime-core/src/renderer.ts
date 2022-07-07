import { ShapeFlags } from "../../shared"
import { Vnode } from "./vnode"

enum ContainerTagAttr {
  VNODE = "__vnode__"
}

function createRenderer(renderOptions : any) {

  const {
    hostCreateElement,
    hostInsert,
    hostSetElementText,
    hostRemove,
    hostPatchProp,
  } = createRenderApi(renderOptions)



  function mountChildren(children : Array<Vnode>,container : Node) {
    for(let i = 0; i < children.length; i++) {
      patch(null,children[i],container)
    }
  }



  function mountELement(vnode : Vnode,container : Node) {
    
    const {type,props,shapeFlag,children} = vnode
    const el = hostCreateElement(type)

    if(props) {
      for(let key in props) {
        hostPatchProp(el,key,null,props[key])
      }
    }

    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el,children)
    } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children,el)
    }

    hostInsert(el,container)
    vnode.el = container
    container[ContainerTagAttr.VNODE] = vnode
  }
  


  function patch(__vnode__ : Vnode | null,vnode : Vnode,container : Node) {   
    if(__vnode__ === vnode) {
      return
    }
  
    if(__vnode__) {
  
    } else {
      mountELement(vnode,container)
    }
  
  }
  


  function unmount(vnode : Vnode) {
    hostRemove(vnode.el)
  }



  function render(vnode : Vnode | null,container : Node) {
    const __vnode__ = container[ContainerTagAttr.VNODE] || null
    if(vnode) {
      patch(__vnode__,vnode,container)
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