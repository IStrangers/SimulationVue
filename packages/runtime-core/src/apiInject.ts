import { getCurrentComponentInstance } from "./component"

function provide(key : string,value : any) {
  const currentComponentInstance = getCurrentComponentInstance()
  if(currentComponentInstance) {
    const parentProvides = currentComponentInstance.parent && currentComponentInstance.parent.provides
    let provides = currentComponentInstance.provides

    if(parentProvides === provides) {
      provides = currentComponentInstance.provides = Object.create(provides)
    }
    provides[key] = value
  }
}

function inject(key : string,defaultValue : any = undefined) {
  const currentComponentInstance = getCurrentComponentInstance()
  if(!currentComponentInstance) {
    return
  }
  const parentProvides = currentComponentInstance.parent && currentComponentInstance.parent.provides
  if(parentProvides && key in parentProvides) {
    return parentProvides[key]
  }
  return defaultValue
}

export {
  provide,
  inject,
}