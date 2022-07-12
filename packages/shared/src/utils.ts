function isObject(value : any) : boolean {
  return typeof value === 'object'
}

function isNumber(value : any) : boolean {
  return !isNaN(value) && typeof value === 'number'
}

function isString(value : any) : boolean {
  return typeof value === 'string'
}

function isBoolean(value : any) : boolean {
  return typeof value === 'boolean'
}

function isArray(value : any) : boolean {
  return Array.isArray(value)
}

function isFunction(value : any) : boolean {
  return typeof value === 'function'
}

function toUppercaseStart(value : string) : string {
  if(value) {
    value = value.replace(value[0],value[0].toUpperCase());
  }
  return value
}

function isUppercaseStart(value : string) : boolean {
  if(value) {
    const c = value.charAt(0)
    if(c >= "A" && c <= "Z") {
      return true
    }
  }
  return false
}

function hasOwnProperty(value : any,key : any) : boolean {
  return Object.prototype.hasOwnProperty.call(value,key)
} 

function removeExtraSpaces(value : string) : string {
  return value.replace(/[\s]+/g,"")
}

function getLongestIncreasingSequence(arr : Array<number>) : Array<number> {
  const len = arr.length
  const result = [0]
  const traceBack = new Array(len)
  let startIndex
  let endIndex
  let middleIndex
  let resultLastIndex;
  for(let i = 0; i < len; i++) {
    let item = arr[i]
    if(item === 0) {
      continue
    }
    resultLastIndex = result[result.length - 1]
    if(arr[resultLastIndex] < item) {
      result.push(i)
      traceBack[i] = resultLastIndex
      continue
    }

    startIndex = 0
    endIndex = result.length - 1
    while(startIndex < endIndex) {
      middleIndex = ((startIndex + endIndex) / 2) | 0
      if(arr[result[middleIndex]] < item) {
        startIndex = middleIndex  + 1
      } else {
        endIndex = middleIndex
      }
    }

    if(arr[result[endIndex]] > item) {
      result[endIndex] = i
      traceBack[i] = result[endIndex - 1]
    }
  }

  let i = result.length
  let last = result[i - 1]
  while(i-- > 0) {
    result[i] = last
    last = traceBack[last]
  }
  return result
}

function invokeFunctions(funs : Array<Function>) {
  for(let i = 0; i < funs.length; i++) {
    const fun = funs[i]
    fun()
  }
}

export {
  isObject,
  isNumber,
  isString,
  isBoolean,
  isArray,
  isFunction,
  hasOwnProperty,
  toUppercaseStart,
  isUppercaseStart,
  removeExtraSpaces,
  getLongestIncreasingSequence,
  invokeFunctions,
}