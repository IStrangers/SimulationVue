import { isArray, isString, ShapeFlags } from "../../shared"

enum VnodeTagAttr {
    IS_VNODE = "__isVnode__",
}

interface Vnode {
    el: null | Node
    key: string
    type: any
    props: any
    children: Array<Vnode>
    shapeFlag: ShapeFlags
    __isVnode__ : boolean
}

function isVnode(value : any) : boolean {
    return value && value[VnodeTagAttr.IS_VNODE]
}

function isSameVnode(node1 : Vnode,node2 : Vnode) : boolean {
    return (node1.type === node2.type) && 
           (node1.key === node2.key)
}

function createVnode(type : any,props : any,children : any) : Vnode {

    let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0

    const __isVnode__ = true
    const vnode = {
        el: null,
        key: props?.key,
        type,
        props,
        children,
        shapeFlag,
        __isVnode__,
    }

    if(children) {
        let type = 0
        if(isArray(children)) {
            type = ShapeFlags.ARRAY_CHILDREN
        } else {
            children = String(children)
            type = ShapeFlags.TEXT_CHILDREN
        }
        vnode.shapeFlag |= type
    }

    return vnode
}

export {
    Vnode,
    isVnode,
    isSameVnode,
    createVnode,
}