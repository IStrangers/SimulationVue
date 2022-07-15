import { Vnode } from "../../runtime-core"
import { isArray, toUppercaseStart } from "../../shared"
import { PatchFlags } from "../../shared/src/patchFlags"
import { NodeTypes } from "./ast"
import { CodegenCall } from "./codegenCall"

function isTextNode(node : Vnode) {
    return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT
}

function createTransform(root : any) {
    return {
        currentNode: root,
        codegenCallMap: new Map(),
        incrementCount(name : any) {
            const count = this.codegenCallMap.get(name) || 0
            this.codegenCallMap.set(name,count + 1)
            return name
        },
        reduceCount(name : any) {
            let count = this.codegenCallMap.get(name)
            if(count) {
                count -= 1
                if(count > 0) {
                    this.codegenCallMap.set(name,count)
                } else {
                    this.codegenCallMap.delete(name)
                }
            }
            return name
        },
        createCallExpression(args : Array<any>) {
            const call = this.incrementCount(CodegenCall.CREATE_TEXT_VNODE)
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
            const call = this.incrementCount(CodegenCall.CREATE_ELEMENT_VNODE)
            return {
                type: NodeTypes.VNODE_CALL,
                call,
                tag,
                props,
                children,
            }
        },
        createElementBlockCall(tag : string,props : any,children : Array<any>) {
            const call = this.incrementCount(CodegenCall.CREATE_ELEMENT_BLOCK)
            return {
                type: NodeTypes.VNODE_CALL,
                call,
                tag,
                props,
                children,
                isBlock: true,
            }
        },
        transformRoot() {
            const { 
                children
            } = this.currentNode
            if(!children || children.length <= 0) {
                return
            }
            this.incrementCount(CodegenCall.OPEN_BLOCK)
            if(children.length === 1) {
                const child = children[0]
                if(child.type === NodeTypes.ELEMENT && child.codegenNode) {
                    this.reduceCount(CodegenCall.CREATE_ELEMENT_VNODE)
                    const { tag,props,children } = child.codegenNode
                    this.currentNode.codegenNode = this.createElementBlockCall(tag,props,children)
                } else {
                    this.currentNode.codegenNode = child
                }
            } else {
                const tag = this.incrementCount(CodegenCall.FRAGMENT)
                this.currentNode.codegenNode = this.createElementBlockCall(tag,null,children)
            }
            this.currentNode.codegenCallMap = this.codegenCallMap
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
                        currentContainer.children.push(" + ",next)
                        children.splice(j,1)
                        j--
                    }
                }
            }
            if(children && children.length > 1) {
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
                    let { type,isNoAttributeValue,name,value } = props[i]
                    if(type === NodeTypes.DIRECTIVE) {
                        const isEvent = name.startsWith(`@`)
                        const isAttr = name.startsWith(`:`)
                        if(isEvent || isAttr) {
                            name = name.slice(1)
                            name = `${isEvent ? `on${toUppercaseStart(name)}` : name}`
                            value.content = `__ctx__.${value.content}`
                        } else if(name.startsWith(`v-`)) {

                        }
                    }
                    properties.push({
                        type,
                        key: name,
                        value : isNoAttributeValue ? null : value.content
                    })
                }
                propsExpression = properties.length > 0 ? this.createObjectExpression(properties) : null
            }
            this.currentNode.codegenNode = this.createVnodeCall(vnodeTag,propsExpression,children.length === 1 ? children[0] : children)
        },
        transformExpression() {
            this.incrementCount(CodegenCall.TO_DISPLAY_STRING)
            const express = this.currentNode.content.express
            if(express) {
                this.currentNode.content.express = `__ctx__.${express}`
            }
        },
        transformComment() {
            this.incrementCount(CodegenCall.CREATE_COMMENT_VNODE)
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
                case NodeTypes.COMMENT:
                    this.transformComment()
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