import { NodeTypes } from "./ast"

function createTransform(root : any) {
    return {
        currentNode: root,
        countMap: new Map(),
        incrementCount(name : any) {
            const count = this.countMap.get(name) || 0
            this.countMap.set(name,count + 1)
            return name
        },
        transformComment() {
            console.log(this.currentNode)
        },
        transformElement() {
            console.log(this.currentNode)
        },
        transformText() {
            console.log(this.currentNode)
        },
        transformExpression() {
            console.log(this.currentNode)
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
                case NodeTypes.COMMENT:
                    this.transformComment()
                    break;
                case NodeTypes.ELEMENT:
                    this.transformElement()
                    break;
                case NodeTypes.INTERPOLATION:
                    this.transformExpression()
                    break;
                case NodeTypes.TEXT:
                    this.transformText()
                    break;
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