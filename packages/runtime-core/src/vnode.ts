import { isArray, isNumber, isObject, isString, ShapeFlags } from "../../shared"
import { PatchFlags } from "../../shared/src/patchFlags"
import { isTeleport } from "./components/Teleport"

const enum VnodeTagAttr {
    IS_VNODE = "__isVnode__",
    COMPONENT = "__component__",
}

const Text = Symbol("Text")
const Fragment = Symbol("Fragment")

interface Vnode {
    el: null | Node
    key: string
    type: any
    props: any
    children: Array<Vnode>
    shapeFlag: ShapeFlags
    __isVnode__ : boolean
    patchFlag : PatchFlags
    dynamicChildren : Array<Vnode> | null
}

function isVnode(value : any) : boolean {
    return value && value[VnodeTagAttr.IS_VNODE]
}

function isSameVnode(node1 : Vnode,node2 : Vnode) : boolean {
    return (node1.type === node2.type) && 
           (node1.key === node2.key)
}

function createVnode(type : any,props : any,children : any,patchFlag : PatchFlags = 0) : Vnode {

    let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 
                    isTeleport(type) ? ShapeFlags.TELEPORT : 
                    isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0

    const __isVnode__ = true
    const vnode = {
        el: null,
        key: props?.key,
        type,
        props,
        children,
        shapeFlag,
        patchFlag,
        __isVnode__,
        dynamicChildren: null
    }

    if(children) {
        let type = 0
        if(isArray(children)) {
            type = ShapeFlags.ARRAY_CHILDREN
        } else if(isObject(children)){
            type = ShapeFlags.SLOTS_CHILDREN
        } else {
            children = String(children)
            type = ShapeFlags.TEXT_CHILDREN
        }
        vnode.shapeFlag |= type
    }

    if(currentBlock && vnode.patchFlag && vnode.patchFlag > 0) {
        currentBlock.push(vnode)
    }
    return vnode
}

let currentBlock : Array<Vnode> | null = null

function openBlock() {
    currentBlock = []
}

function setupBlock(vnode : Vnode) {
    vnode.dynamicChildren = currentBlock
    currentBlock = null
    return vnode
}

function createElementBlock(type : any,props : any,children : any,patchFlag : PatchFlags) {
    const vnode = createVnode(type,props,children,patchFlag)
    return setupBlock(vnode)
}

function toDisplayString(val : any) {
    return isString(val) ? val : 
           val === null ? '' : 
           isObject(val) ? JSON.stringify(val) :
           String(val)
}

function renderList(source : number | string | object | Array<any>,renderHandling : Function) : Array<any> {
    const nodes : Array<any> = []
    if(isArray(source) || isString(source)) {
        const data = source as any
        for(let i = 0; i < data.length; i++) {
        nodes.push(renderHandling(data[i],i))
        }
    } else if(isObject(source)) {
        const data = source as object
        const dataKeys = Object.keys(data)
        for(let i = 0; i < dataKeys.length; i++) {
        const key = dataKeys[i]
        nodes.push(renderHandling(data[key],key))
        }
    } else if(isNumber(source)) {
        const data = source as number
        for(let i = 0; i < data; i++) {
        nodes.push(renderHandling(i))
        }
    }
    return nodes
}

export {
    Vnode,
    VnodeTagAttr,
    Text,
    Fragment,
    isVnode,
    isSameVnode,
    createVnode,
    openBlock,
    createElementBlock,
    createVnode as createElementVnode,
    toDisplayString,
    renderList,
}