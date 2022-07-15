import { isArray, isNumber, isString } from "../../shared"
import { NodeTypes } from "./ast"
import { CodegenCall } from "./codegenCall"

function createCodegen(root : any) {
    return {
        code: "",
        indentLevel: 0,
        addCode(code : string) {
            this.code += code
        },
        indent() {
            this.newLine(++this.indentLevel)
        },
        deindent(whithoutNewLine = false) {
            if(whithoutNewLine) {
                --this.indentLevel
            } else {
                this.newLine(--this.indentLevel)
            }
        },
        newLine(n : number = -1) {
            n = n === -1 ? this.indentLevel : n
            this.addCode("\n" + " ".repeat(n * 2))
        },
        genNullableArgs(args: Array<any>){
            let i = args.length
            while (i--) {
              if (args[i] != null) break
            }
            return args.slice(0, i + 1).map(arg => arg || `null`)
        },
        genElementCode(codegenNode : any) {
            this.genNodeCode(codegenNode.codegenNode)
        },
        genVnodeCallCode(codegenNode : any) {
            const { tag,props,isBlock,call,children } = codegenNode
            isBlock && this.addCode(`(${CodegenCall.OPEN_BLOCK}(),`)
            this.addCode(`${call}(`)
            const args = [tag,props]
            if((isArray(children) && children.length > 0 ) || children) {
                args.push(children)
            }
            this.genNodeList(this.genNullableArgs(args))
            this.addCode(`)`)
            isBlock && this.addCode(`)`)
        },
        genObjectExpression(props : any) {
            if(!props) {
                this.addCode(`{}`)
                return
            }
            const { properties } = props
            if (!properties.length) {
                this.addCode(`{}`)
                return
            }
            const isNultipleProp = properties.length > 1
            this.addCode(isNultipleProp ? `{` : `{ `)
            isNultipleProp && this.indent()
            for(let i = 0; i < properties.length; i++) {
                const { type,key,value } = properties[i]
                const val = type === NodeTypes.DIRECTIVE ? value : `"${value}"`
                this.addCode(key)
                this.addCode(`: `)
                this.addCode(val)
                if (i < properties.length - 1) {
                    this.addCode(`,`)
                    this.newLine()
                }
            }
            isNultipleProp && this.deindent()
            this.addCode(isNultipleProp ? `}` : ` }`)
        },
        genNodeArray(nodeArray : Array<any>) {
            if(!nodeArray || nodeArray.length <= 0) {
                return
            }
            const isNultipleNodes = nodeArray.length > 1
            this.addCode(`[`)
            isNultipleNodes && this.indent()
            this.genNodeList(nodeArray,isNultipleNodes)
            isNultipleNodes && this.deindent()
            this.addCode(`]`)
        },
        genNodeList(nodeList : Array<any>,isNultipleNodes : boolean = false) {
            if(!nodeList || nodeList.length <= 0) {
                return
            }
            for(let i = 0; i < nodeList.length; i++) {
                const node = nodeList[i]
                if(isString(node) || isNumber(node)) {
                    this.addCode(node)
                } else if(isArray(node)) {
                    this.genNodeArray(node)
                } else {
                    this.genNodeCode(node)
                }
                if((i + 1) < nodeList.length) {
                    this.addCode(",")
                    isNultipleNodes && this.newLine()
                }
            }
        },
        genTextCode(codegenNode : any) {
            this.addCode(JSON.stringify(codegenNode.content))
        },
        genCommentCode(codegenNode : any) {
            this.addCode(`${CodegenCall.CREATE_COMMENT_VNODE}(`)
            this.genNodeCode(codegenNode.content)
            this.addCode(`)`)
        },
        genInterpolationCode(codegenNode : any) {
            this.addCode(`${CodegenCall.TO_DISPLAY_STRING}(`)
            this.genNodeCode(codegenNode.content)
            this.addCode(`)`)
        },
        genExpressionCode(codegenNode : any) {
            this.addCode(codegenNode.express)
        },
        genTextCallCode(codegenNode : any) {
            this.genNodeCode(codegenNode.codegenNode)
        },
        genCallExpressionCode(codegenNode : any) {
            const { call,args } = codegenNode
            this.addCode(`${call}(`)
            this.genNodeList(args)
            this.addCode(`)`)
        },
        genCompoundExpression(codegenNode : any) {
            const { children } = codegenNode
            if(!children) {
                return
            }
            for (let i = 0; i < children.length; i++) {
                const child = children[i]
                if (isString(child)) {
                    this.addCode(child)
                } else {
                    this.genNodeCode(child)
                }
            }
        },
        genNodeCode(codegenNode : any) {
            const { type } = codegenNode
            switch(type) {
                case NodeTypes.ELEMENT:
                    this.genElementCode(codegenNode)
                    break
                case NodeTypes.TEXT:
                    this.genTextCode(codegenNode)
                    break
                case NodeTypes.COMMENT:
                    this.genCommentCode(codegenNode)
                    break
                case NodeTypes.SIMPLE_EXPRESSION:
                    this.genExpressionCode(codegenNode)
                    break
                case NodeTypes.INTERPOLATION:
                    this.genInterpolationCode(codegenNode)
                    break
                case NodeTypes.COMPOUND_EXPRESSION:
                    this.genCompoundExpression(codegenNode)
                    break
                case NodeTypes.TEXT_CALL:
                    this.genTextCallCode(codegenNode)
                    break
                case NodeTypes.VNODE_CALL:
                    this.genVnodeCallCode(codegenNode)
                    break
                case NodeTypes.JS_CALL_EXPRESSION:
                    this.genCallExpressionCode(codegenNode)
                    break
                case NodeTypes.JS_OBJECT_EXPRESSION:
                    this.genObjectExpression(codegenNode)
                    break
            }
        },
        genRootCode(root : any) {
            const { codegenNode } = root
            if(codegenNode) {
                this.genNodeCode(codegenNode)
            } else {
                this.addCode(`null`)
            }
        },
        genCode() {
            const {
                codegenCallMap
            } = root
            if(codegenCallMap && codegenCallMap.size > 0) {
                const codegenCalls = [...codegenCallMap.keys()].join(`,`)
                this.addCode(`const { ${codegenCalls} } from SimulationVue`)
                this.newLine()
                this.newLine()
            }
            this.addCode(`export `)
            const functionName = `render`
            const args = [`__ctx__`,`__cache__`,`$props`,`$setup`,`$data`,`$options`]
            this.addCode(`function ${functionName}(${args.join(`,`)}) {`)
            this.indent()
            this.addCode(`return `)
            this.genRootCode(root)
            this.deindent()
            this.addCode(`}`)
            return this.code
        },
    }
}

function generate(ast : any) {
    console.log(ast)
    const codegen = createCodegen(ast)
    return codegen.genCode()
}

export {
    generate
}
