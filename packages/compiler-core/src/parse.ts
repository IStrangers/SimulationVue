import { removeExtraSpaces } from "../../shared"
import { NodeTypes } from "./ast"

interface ParseOptions {
  isRemoveExtraSpaces: boolean
  delimiters: {
    interpolationStart: string
    interpolationEnd: string
  }
}

interface Parser {
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
  advanceBySpaces: Function
  isEnd: Function
  isElement: Function
  isInterpolation: Function
  isComment: Function
  parseElement: Function
  parseElementTag: Function
  parseElementAttributes: Function
  parseElementAttribute: Function
  parseElementAttributeValue: Function
  parseElementChildren: Function
  parseInterpolation: Function
  parseComment: Function
  parseText: Function
  parseTextData: Function
}

function createParser(template : string) : Parser{
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
    advanceBySpaces: function() {
      const match = /^[ \n\r\t\f]+/.exec(this.source)
      if(match) {
        this.advanceBy(match[0].length)
      }
    },
    isEnd() {
      return !this.source || this.source.startsWith("</")
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
      const el = this.parseElementTag(parent)
      el.children = this.parseElementChildren(el)
      if(this.source.startsWith("</")) {
        this.parseElementTag()
      }
      el.location = this.getSelection(el.location.startCursor)
      return el
    },
    parseElementTag(parent : any) {
      const startCursor = this.getCursor()
      const match = /^<\/?([A-z][^ \t\r\n/>]*)/.exec(this.source)
      if(!match) {
        return
      }
      const tag = match[1]
      this.advanceBy(match[0].length)
      this.advanceBySpaces()
      const props = this.parseElementAttributes()
      const isSelfClosing = this.source.startsWith("/>")
      this.advanceBy(isSelfClosing ? 2 : 1)
      return {
        parent,
        type: NodeTypes.ELEMENT,
        tag,
        props,
        isSelfClosing,
        location: this.getSelection(startCursor)
      }
    },
    parseElementAttributes() {
      const props : Array<any> = []
      while(!this.source.startsWith(">") && !this.isEnd()) {
        const attr = this.parseElementAttribute()
        props.push(attr)
        this.advanceBySpaces()
      }
      return props
    },
    parseElementAttribute() {
      const startCursor = this.getCursor()
      const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(this.source)
      if(!match) {
        return
      }

      const name = match[0]
      let value
      let isNoAttributeValue = false
      this.advanceBy(name.length)
      this.advanceBySpaces()
      if(this.source.startsWith("=")) {
        this.advanceBy(1)
        this.advanceBySpaces()
        value = this.parseElementAttributeValue()
      } else {
        isNoAttributeValue = true
      }

      const isDirective = name.startsWith("@") || name.startsWith(":") || name.startsWith("v-")
      let type = isDirective ? NodeTypes.DIRECTIVE : NodeTypes.ATTRIBUTE
      return {
        type,
        name,
        isNoAttributeValue,
        value: {
          type: NodeTypes.TEXT,
          ...value
        },
        location: this.getSelection(startCursor)
      }
    },
    parseElementAttributeValue() {
      const startCursor = this.getCursor()
      const quote = this.source[0]

      let content
      if(quote === `'` || quote === `"`) {
        this.advanceBy(1)
        const endQuoteIndex = this.source.indexOf(quote)
        content = this.parseTextData(endQuoteIndex)
        this.advanceBy(1)
      } else {
        const endSpacesIndex = this.source.indexOf(" ")
        let endCloseingIndex = this.source.indexOf(">")
        endCloseingIndex = endCloseingIndex !== -1 ? endCloseingIndex : this.source.indexOf("/>")
        let endIndex = endSpacesIndex;
        if(endSpacesIndex === -1 || endSpacesIndex > endCloseingIndex) {
          endIndex = endCloseingIndex
        }
        content = this.parseTextData(endIndex)
      }

      return {
        content,
        location: this.getSelection(startCursor)
      }
    },
    parseElementChildren(parent : any) {
      const nodes: Array<any> = []
      while(!this.isEnd()) {
        let node;
        if(this.isComment()) {
          node = this.parseComment(parent)
        } else if(this.isElement()) {
          node = this.parseElement(parent)
        } else if(this.isInterpolation()) {
          node = this.parseInterpolation(parent)
        } else {
          node = this.parseText(parent)
          if(this.options.isRemoveExtraSpaces && removeExtraSpaces(node.content) === ""){
            continue
          }
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

function createRoot(children? : Array<any>,location? : any) {
  return {
    type: NodeTypes.ROOT,
    children,
    location,
  }
}

function parse(template : string) : any {
  const parser = createParser(template);
  const startCursor = parser.getCursor()
  const root = createRoot()
  root.children = parser.parseElementChildren(root)
  root.location = parser.getSelection(startCursor)
  return root
}

export {
  parse
}