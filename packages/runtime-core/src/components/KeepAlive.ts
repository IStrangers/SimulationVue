import { ShapeFlags } from "../../../shared"
import { getCurrentComponentInstance } from "../component"
import { onMounted, onUpdated } from "../lifecycle"
import { isVnode, Vnode, VnodeTagAttr } from "../vnode"

const enum KeepAliveTagAttr {
  IS_KEEP_ALIVE = "__isKeepAlive__"
}

class KeepAliveImpl {
  __isKeepAlive__ = true
  props = {
    include: {},
    exclude: {}
  }
  cache = new Map()
  storageContainer = null
  deactivate : Function | undefined = undefined
  activate : Function | undefined = undefined

  setup(props : any,context : any) {
    const currentComponentInstance = getCurrentComponentInstance()
    if(!currentComponentInstance) {
      return
    }
    const { hostCreateElement,moveElement } = currentComponentInstance.ctx.renderer
    this.storageContainer = hostCreateElement(`div`)
    this.deactivate = (vnode : Vnode) => {
      const component = vnode[VnodeTagAttr.COMPONENT]
      moveElement(component.subTree.el,this.storageContainer,null)
    }
    this.activate = (vnode : Vnode,container : Node,anchor : Node | null) => {
      const component = vnode[VnodeTagAttr.COMPONENT]
      moveElement(component.subTree.el,container,anchor)
    }

    let pendingCacheKey : any = null
    const cacheSubTree = () => {
      if(pendingCacheKey) {
        this.cache.set(pendingCacheKey,currentComponentInstance.subTree)
      }
    }
    onMounted(cacheSubTree)
    onUpdated(cacheSubTree)

    return () => {
      debugger
      const { slots } = context
      const vnode = slots.default()
      if(!isVnode(vnode) || vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        return vnode
      }
      let { type,key } = vnode
      key = key ? key : type
      const cacheVnode = this.cache.get(key)
      if(cacheVnode) {
        vnode[VnodeTagAttr.COMPONENT] = cacheVnode[VnodeTagAttr.COMPONENT]
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE
      } else {
        pendingCacheKey = key
      }
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
      return vnode
    }
  }
}

function isKeepAlive(obj : object) {
  return obj && obj[KeepAliveTagAttr.IS_KEEP_ALIVE]
}

const KeepAlive = new KeepAliveImpl()

export {
  KeepAlive,
  isKeepAlive,
}