import { ShapeFlags } from "../../../shared"
import { getCurrentComponentInstance } from "../component"
import { onMounted, onUpdated } from "../lifecycle"
import { isVnode, Vnode, VnodeTagAttr } from "../vnode"

const enum KeepAliveTagAttr {
  IS_KEEP_ALIVE = "__isKeepAlive__"
}

class KeepAliveImpl {
  __isKeepAlive__ = true
  props : any = {
    include: [],
    exclude: [],
    max: undefined
  }
  keys = new Set()
  cache = new Map()
  storageContainer : Node | null = null
  deactivate : Function | undefined = undefined
  activate : Function | undefined = undefined

  setup = (props : any,context : any) => {
    const currentComponentInstance = getCurrentComponentInstance()
    if(!currentComponentInstance) {
      return
    }
    const { hostCreateElement,moveElement } = currentComponentInstance.ctx.renderer
    this.props = props
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

    let currentVnode : Vnode | null = null
    const { include,exclude,max } = this.props

    return () => {
      const { slots } = currentComponentInstance
      const vnode = slots[`default`]()
      if(!(isVnode(vnode) && vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
        return vnode
      }

      let { type,key } = vnode
      key = key ? key : type
      const name = type.name
      if(name && (
        (include && !include.includes(name))
        || 
        (exclude && exclude.includes(name))
      )) {
        return vnode
      }

      const pruneCacheEntrt = () => {
        currentVnode && resetShapFlag(currentVnode)
        const key = this.keys.keys().next().value
        this.cache.delete(key)
        this.keys.delete(key)
      }

      const cacheVnode = this.cache.get(key)
      if(cacheVnode) {
        vnode[VnodeTagAttr.COMPONENT] = cacheVnode[VnodeTagAttr.COMPONENT]
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE
        this.keys.delete(key)
        this.keys.add(key)
      } else {
        pendingCacheKey = key
        if(max && max > this.cache.size) {
          pruneCacheEntrt()
        }
      }
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
      currentVnode = vnode
      return vnode
    }
  }

}

function resetShapFlag(vnode : Vnode) {
  let { shapeFlag } = vnode
  if(shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
    shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
  }
  if(shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
    shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE
  }
  vnode.shapeFlag = shapeFlag
}

function isKeepAlive(obj : object) {
  return obj && obj[KeepAliveTagAttr.IS_KEEP_ALIVE]
}

const KeepAlive = new KeepAliveImpl()

export {
  KeepAlive,
  isKeepAlive,
}