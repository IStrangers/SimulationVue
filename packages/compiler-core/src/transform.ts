import { Vnode } from "../../runtime-core"
import { PatchFlags } from "../../shared/src/patchFlags"
import { NodeTypes } from "./ast"
import { CodegenNodeCall } from "./codegenNodeCall"

function isTextNode(node : Vnode) {
    return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT
}

function createTransform(root : any) {
    return {
        currentNode: root,
        codegenNodeCallMap: new Map(),
        incrementCount(name : any) {
            const count = this.codegenNodeCallMap.get(name) || 0
            this.codegenNodeCallMap.set(name,count + 1)
            return name
        },
        reduceCount(name : any) {
            let count = this.codegenNodeCallMap.get(name)
            if(count) {
                count -= 1
                if(count > 0) {
                    this.codegenNodeCallMap.set(name,count)
                } else {
                    this.codegenNodeCallMap.delete(name)
                }
            }
            return name
        },
        createCallExpression(args : Array<any>) {
            const call = this.incrementCount(CodegenNodeCall.CREATE_TEXT_VNODE)
            return {
                type: NodeTypes.JS_CALL_EXPRESSION,
                call,
                args,
            }
        },
        createObjectExpression(properties : Array<any>) {
            return {
                type: NodeTypes.JS_OBJECT_EXPRESSION,
                properties
            }
        },
        createVnodeCall(tag : string,props : any,children : Array<any>) {
            const call = this.incrementCount(CodegenNodeCall.CREATE_ELEMENT_VNODE)
            return {
                type: NodeTypes.VNODE_CALL,
                call,
                tag,
                props,
                children,
            }
        },
        transformRoot() {
            const { 
                children
            } = this.currentNode
            if(!children || children.length <= 0) {
                return
            }
            if(children.length === 1) {
                const child = children[0]
                if(child.type === NodeTypes.ELEMENT && child.codegenNode) {
                    this.currentNode.codegenNode = child.codegenNode
                    this.reduceCount(CodegenNodeCall.CREATE_ELEMENT_VNODE)
                    this.incrementCount(CodegenNodeCall.OPEN_BLOCK)
                    this.incrementCount(CodegenNodeCall.CREATE_ELEMENT_BLOCK)
                    this.currentNode.codegenNode.isBlock = true
                } else {
                    this.currentNode.codegenNode = child
                }
            } else {
                const tag = this.incrementCount(CodegenNodeCall.FRAGMENT)
                const codegenNode = {
                    isBlock: true,
                    codegenNode: this.createVnodeCall(tag,null,children)
                }
                this.incrementCount(CodegenNodeCall.OPEN_BLOCK)
                this.incrementCount(CodegenNodeCall.CREATE_ELEMENT_BLOCK)
                this.currentNode.codegenNode = codegenNode
            }
            this.currentNode.codegenNodeCallMap = this.codegenNodeCallMap
        },
        transformElement() {
            const { 
                tag,
                props,
                children 
            } = this.currentNode
            if(children && children.length > 1) {
                let currentContainer = null
                for(let i = 0; i < children.length; i++) {
                    const child = children[i]
                    if(!isTextNode(child)) {
                        continue
                    }
                    for(let j = i + 1; j < children.length; j++) {
                        const next = children[j]
                        if(!isTextNode(next)) {
                            currentContainer = null
                            break
                        }
                        if(!currentContainer) {
                            currentContainer = children[i] = {
                                type: NodeTypes.COMPOUND_EXPRESSION,
                                children: [child]
                            }
                        }
                        currentContainer.children.push("+",next)
                        children.splice(j,1)
                        j--
                    }
                }

                for(let i = 0; i < children.length; i++) {
                    const child = children[i]
                    const callArgs = []
                    if(!isTextNode(child) && child.type !== NodeTypes.COMPOUND_EXPRESSION) {
                        continue
                    }
                    callArgs.push(child)
                    if(child.type !== NodeTypes.TEXT) {
                        callArgs.push(PatchFlags.TEXT)
                    }
                    children[i] = {
                        type: NodeTypes.TEXT_CALL,
                        content: child,
                        codegenNode: this.createCallExpression(callArgs)
                    }
                }
            }

            const vnodeTag = `"${tag}"`
            const properties = []
            let propsExpression = null;
            if(props) {
                for(let i = 0; i < props.length; i++) {
                    const { type,isNoAttributeValue,name,value } = props[i]
                    properties.push({
                        type,
                        key: name,
                        value : isNoAttributeValue ? null : value.content
                    })
                }
                propsExpression = properties.length > 0 ? this.createObjectExpression(properties) : null
            }
            this.currentNode.codegenNode = this.createVnodeCall(vnodeTag,propsExpression,children)
        },
        transformExpression() {
            this.incrementCount(CodegenNodeCall.TO_DISPLAY_STRING)
            this.currentNode.content.express = `__ctx__.${this.currentNode.content.express}`
        },
        traverse() {
            const copyCurrentNode = this.currentNode
            const { type,children } = copyCurrentNode
            if(children) {
                for(let i = 0; i < children.length; i++) {
                    this.currentNode = children[i]
                    this.traverse()
                }
                this.currentNode = copyCurrentNode
            }
            switch(type) {
                case NodeTypes.ROOT:
                    this.transformRoot()
                    break
                case NodeTypes.ELEMENT:
                    this.transformElement()
                    break
                case NodeTypes.INTERPOLATION:
                    this.transformExpression()
                    break
            }
        }
    }
}

function transform(ast : any) {
    const transform = createTransform(ast)
    transform.traverse()
}

export {
    transform
}