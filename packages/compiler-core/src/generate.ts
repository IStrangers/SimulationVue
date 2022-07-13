import { NodeTypes } from "./ast"
import { CodegenNodeCall } from "./codegenNodeCall"

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
        deindent(whithoutNewLine = true) {
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
        genElementCode(codegenNode : any) {
            this.genNodeCode(codegenNode.codegenNode)
        },
        genVnodeCallCode(codegenNode : any) {
            const { tag,props,isBlock,call,children } = codegenNode
            isBlock && this.addCode(`(${CodegenNodeCall.OPEN_BLOCK}(),`)

            this.addCode(`${call}(${tag}`)
            this.genElementPropsCode(props)            

            if(children && children.length > 0) {
                const isNultipleNodes = children.length > 1
                if(isNultipleNodes) {
                    this.addCode(`[`);
                    this.indent()
                }
                for(let i = 0; i < children.length; i++) {
                    this.genNodeCode(children[i])
                    if((i + 1) < children.length) {
                        this.addCode(",")
                    } else {
                        isNultipleNodes && this.deindent();
                    }
                    isNultipleNodes && this.newLine()
                }
                isNultipleNodes && this.addCode(`]`)
            }

            this.addCode(`)`)
            isBlock && this.addCode(`)`)
        },
        genElementPropsCode(props : any) {
            if(!props) {
                return
            }
            const { properties } = props
            this.addCode(`,`)
            this.addCode(`{`)
            this.indent()
            for(let i = 0; i < properties.length; i++) {
                const { type,key,value } = properties[i]
                const val = type === NodeTypes.DIRECTIVE ? value : `"${value}"`
                this.addCode(`${key}:${val}`)
                if((i + 1) < properties.length) {
                    this.addCode(",")
                } else {
                    this.deindent()
                }
                this.newLine()
            }
            this.addCode(`}`)
            this.addCode(`,`)
        },
        genTextCode(codegenNode : any) {
            this.addCode(JSON.stringify(codegenNode.content))
        },
        genInterpolationCode(codegenNode : any) {
            this.addCode(`${CodegenNodeCall.TO_DISPLAY_STRING}(`)
            this.genNodeCode(codegenNode.content)
            this.addCode(`)`)
        },
        genExpressionCode(codegenNode : any) {
            this.addCode(codegenNode.express)
        },
        genTextCallCode(codegenNode : any) {
            this.genNodeCode(codegenNode.codegenNode)
        },
        genJsCallCode(codegenNode : any) {
            const { type,call,args } = codegenNode
            this.addCode(`${call}(${args.map((arg : any) => {
                return arg.type !== NodeTypes.TEXT ? arg.content : `"${arg.content}"`
            }).join()})`)
        },
        genCompoundExpression(codegenNode : any) {
            
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
                    this.genJsCallCode(codegenNode)
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
                codegenNodeCallMap
            } = root
            if(codegenNodeCallMap && codegenNodeCallMap.size > 0) {
                const codegenNodeCalls = [...codegenNodeCallMap.keys()].join(`,`)
                this.addCode(`const { ${codegenNodeCalls} } from SimulationVue`)
                this.newLine()
                this.newLine()
            }
            this.addCode(`export `)
            const functionName = `render`
            const args = [`__ctx__`,`__cache__`,`__props__`]
            this.addCode(`function ${functionName}(${args.join(`,`)}) {`)
            this.indent()
            this.addCode(`return `)
            this.genRootCode(root)
            this.deindent()
            this.newLine()
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
