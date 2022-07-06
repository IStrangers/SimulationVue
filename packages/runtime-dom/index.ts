import { createRenderer } from "../runtime-core/src/renderer"
import { nodeOps } from "./src/nodeOps"
import { patchProp } from "./src/patchProp"

const renderOptions = Object.assign(nodeOps,{patchProp})

function render(vnode : any,container : Node) {
  createRenderer(renderOptions).render(vnode,container)
}

export {
  render
}