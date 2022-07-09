import { createRenderer } from "../runtime-core"
import { Text,Fragment,Vnode } from "../runtime-core/src/vnode"
import { nodeOps } from "./src/nodeOps"
import { patchProp,patchProps } from "./src/patchProp"

const renderOptions = Object.assign(nodeOps,{patchProp,patchProps})

function render(vnode : Vnode,container : Node) {
  createRenderer(renderOptions).render(vnode,container)
}

export * from "../runtime-core"

export {
  Text,
  Fragment,
  render
}