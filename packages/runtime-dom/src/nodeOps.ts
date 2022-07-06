const svgNS = "http://www.w3.org/2000/svg"

export const nodeOps = {
  insert: (child : Node, parent : Node, anchor : any) => {
    parent.insertBefore(child, anchor || null)
  },
  remove: (child : Node) => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },
  createElement: (tag : string, isSVG : boolean, is : any, props : any): Element => {
    const el = isSVG
      ? document.createElementNS(svgNS, tag)
      : document.createElement(tag, is ? { is } : undefined)

    if (tag === 'select' && props && props.multiple != null) {
      ;(el as HTMLSelectElement).setAttribute('multiple', props.multiple)
    }
    return el
  },
  createText: (text : string) => document.createTextNode(text),
  createComment: (text : string) => document.createComment(text),
  setText: (node : Node, text : string) => {
    node.nodeValue = text
  },
  setElementText: (el : Node, text : string) => {
    el.textContent = text
  },
  parentNode: (node : Node) => node.parentNode as Element | null,
  nextSibling: (node : Node) => node.nextSibling,
  querySelector: (selector : string) => document.querySelector(selector),
  setScopeId(el : Element, id : string) {
    el.setAttribute(id, '')
  },
  cloneNode(el : Node) {
    const cloned = el.cloneNode(true)
    if (`_value` in el) {
      ;(cloned as any)._value = (el as any)._value
    }
    return cloned
  },
}