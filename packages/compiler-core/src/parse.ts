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
  parseElementChildren: Function
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
    advancePositionWithMutation(cursor : any,source : string,length : number) {
      let linesCount = 0
      let linePos = -1
      for(let i = 0; i < length; i++) {
        if(source.charCodeAt(i) === 10) {
          linesCount++
          linePos = i
        }
      }
      cursor.line += linesCount
      cursor.column = linePos === -1 ? (cursor.column + length) : (length - linePos)
      cursor.offset += length
    },
    advanceBy(length : number = 1) {
      this.advancePositionWithMutation(this,this.source,length)
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
    parseElementChildren(parent : any) {
      const nodes: Array<any> = []
      while(!this.isEnd()) {
        let node;
        if(this.isComment()) {
          node = this.parseComment()
        } else if(this.isElement()) {
          node = this.parseElement()
        } else if(this.isInterpolation()) {
          node = this.parseInterpolation()
        } else {
          node = this.parseText()
        }
        nodes.push(node)
      }
      return nodes
    },
    parseInterpolation(parent : any) {
      const startCursor = this.getCursor()
      const {interpolationStart,interpolationEnd} = this.options.delimiters
      this.advanceBy(interpolationStart.length)
      
      const innerStartCursor = this.getCursor()
      const innerEndCursor = this.getCursor()

      const endIndex = this.source.indexOf(interpolationEnd)
      const preContent = this.parseTextData(endIndex)
      const express = preContent.trim()
      const startOffset = preContent.indexOf(express)
      if(startOffset > 0) {
        this.advancePositionWithMutation(innerStartCursor,preContent,startOffset)
      }
      const endOffset = startOffset + express.length
      this.advancePositionWithMutation(innerEndCursor,preContent,endOffset)

      this.advanceBy(interpolationEnd.length)
      return {
        parent,
        type: NodeTypes.INTERPOLATION,
        content : {
          type: NodeTypes.SIMPLE_EXPRESSION,
          express,
          location: this.getSelection(innerStartCursor,innerEndCursor)
        },
        location: this.getSelection(startCursor)
      }
    },
    parseComment(parent : any) {
      const startCursor = this.getCursor()
      const commentStart = "<!--"
      const commentEnd = "-->"
      this.advanceBy(commentStart.length)
      
      const innerStartCursor = this.getCursor()
      const innerEndCursor = this.getCursor()

      const endIndex = this.source.indexOf(commentEnd)
      const preContent = this.parseTextData(endIndex)
      const express = preContent.trim()
      const startOffset = preContent.indexOf(express)
      if(startOffset > 0) {
        this.advancePositionWithMutation(innerStartCursor,preContent,startOffset)
      }
      const endOffset = startOffset + express.length
      this.advancePositionWithMutation(innerEndCursor,preContent,endOffset)

      this.advanceBy(commentEnd.length)
      return {
        parent,
        type: NodeTypes.COMMENT,
        content : {
          type: NodeTypes.COMMENT,
          express,
          location: this.getSelection(innerStartCursor,innerEndCursor)
        },
        location: this.getSelection(startCursor)
      }
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
  const parseContext = createParseContext(template);
  return parseContext.parseElementChildren()
}

export {
  parse
}