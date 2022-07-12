import { NodeTypes } from "./ast"

interface ParseOptions {
  isRemoveExtraSpaces: boolean
  delimiters: {
    interpolationStart: string
    interpolationEnd: string
  }
}

interface ParseContext {
  options: ParseOptions
  line: number
  column: number
  offset: number
  source: string
  originalSource: string
  getCursor: Function
  getSelection: Function
  advancePositionWithMutation: Function
  advanceBy: Function
  isEnd: Function
  isElement: Function
  isInterpolation: Function
  isComment: Function
  parseElement: Function
  parseElementTag: Function
  parseElementAttribute: Function
  parseElementChildrenAstNode: Function
  parseInterpolation: Function
  parseComment: Function
  parseText: Function
  parseTextData: Function
}

function createParseContext(template : string) : ParseContext{
  return {
    options: {
      isRemoveExtraSpaces: true,
      delimiters : {
        interpolationStart:"{{",
        interpolationEnd:"}}"
      }
    },
    line: 1,
    column: 1,
    offset: 0,
    source: template,
    originalSource: template,
    getCursor() {
      return {
        line: this.line,
        column: this.column,
        offset: this.offset,
      }
    },
    getSelection(startCursor : any,endCursor : any) {
      endCursor = endCursor || this.getCursor()
      return {
        startCursor,
        endCursor,
        source: this.originalSource.slice(startCursor.offset,endCursor.offset)
      }
    },
    advancePositionWithMutation(length : number) {
      let linesCount = 0
      let linePos = -1
      for(let i = 0; i < length; i++) {
        if(this.source.charCodeAt(i) === 10) {
          linesCount++
          linePos = i
        }
      }
      this.line += linesCount
      this.column = linePos === -1 ? (this.column + length) : (length - linePos)
      this.offset += length
    },
    advanceBy(length : number = 1) {
      this.advancePositionWithMutation(length)
      this.source = this.source.slice(length)
    },
    isEnd() {
      return !this.source
    },
    isElement() : boolean {
      return this.source.startsWith("<")
    },
    isInterpolation() : boolean {
      return this.source.startsWith(this.options.delimiters.interpolationStart)
    },
    isComment() : boolean {
      return this.source.startsWith("<!--")
    },
    parseElement(parent : any) {

    },
    parseElementTag() {

    },
    parseElementAttribute() {
      
    },
    parseElementChildrenAstNode(parent : any) {
      
    },
    parseInterpolation(parent : any) {

    },
    parseComment(parent : any) {

    },
    parseText(parent : any) {
      const tokens = ["<",this.options.delimiters.interpolationStart]
      let endTextIndex = this.source.length;
      for(let i = 0; i < tokens.length; i++) {
        const index = this.source.indexOf(tokens[i])
        if(index != -1 && index < endTextIndex) {
          endTextIndex = index
        }
      }
      const startCursor = this.getCursor()
      const content = this.parseTextData(endTextIndex)
      return {
        parent,
        type: NodeTypes.TEXT,
        content,
        location: this.getSelection(startCursor)
      }
    },
    parseTextData(endTextIndex : number) {
      const data = this.source.slice(0,endTextIndex)
      this.advanceBy(endTextIndex)
      return data
    },
  }
}

function parse(template : string) : Array<any> {
  const nodes: Array<any> = []
  const parseContext = createParseContext(template);
  while(!parseContext.isEnd()) {
    let node;
    if(parseContext.isComment()) {

    } else if(parseContext.isElement()) {

    } else if(parseContext.isInterpolation()) {

    } else {
      node = parseContext.parseText()
    }
    nodes.push(node)
  }
  return nodes
}

export {
  parse
}