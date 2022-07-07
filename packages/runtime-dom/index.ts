import { createRenderer } from "../runtime-core"
import { Vnode } from "../runtime-core/src/vnode"
import { nodeOps } from "./src/nodeOps"
import { patchProp } from "./src/patchProp"

const renderOptions = Object.assign(nodeOps,{patchProp})

function render(vnode : Vnode,container : Node) {
  createRenderer(renderOptions).render(vnode,container)
}

export * from "../runtime-core"

export {
  render
}