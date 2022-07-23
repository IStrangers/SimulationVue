import { Vnode } from "../vnode"

const enum TeleportTagAttr {
  IS_TELEPORT = "__isTeleport__"
}

class TeleportImpl {
    __isTeleport__: boolean = true
    processTeleport(oldVnode : Vnode | null,newVnode : Vnode,container : Node,anchor : Node | null,internals : any) {
      const { mountChildren,patchChildren,moveElements } = internals
      if(oldVnode) {
        patchChildren(oldVnode,newVnode,container)
        const { props: oldProps } = oldVnode
        const { props: newProps,children } = newVnode
        if(oldProps.to !== newProps.to) {
          const newTarget = document.querySelector(newProps.to)
          if(newTarget) {
            moveElements(children,newTarget,null)
          }
        }
      } else {
        const { props,children } = newVnode
        const target = document.querySelector(props.to)
        if(target) {
          mountChildren(children,target,null)
        }
      }
    }
}

function isTeleport(obj : object) {
  return obj && obj[TeleportTagAttr.IS_TELEPORT]
}

const Teleport = new TeleportImpl()

export {
  Teleport,
  isTeleport,
}