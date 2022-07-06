function isObject(value : any) : boolean {
  return typeof value === 'object'
}

function isNumber(value : any) : boolean {
  return value != NaN && typeof value === 'number'
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

function isUppercaseStart(value : string) : boolean {
  if(value) {
    const c = value.charAt(0)
    if(c >= "A" && c <= "Z") {
      return true
    }
  }
  return false
}

function removeExtraSpaces(value : string) : string {
  return value.replace(/[\s]+/g," ").trim()
}

export {
  isObject,
  isNumber,
  isString,
  isBoolean,
  isArray,
  isFunction,
  isUppercaseStart,
  removeExtraSpaces,
}