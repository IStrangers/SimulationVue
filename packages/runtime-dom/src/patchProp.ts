enum PatchTagAttr {
  BIND_INVOKER_EVENT_MAPPING = "__bindInvokerEventMapping__",
}

function patchClass(el : Element,nextValue : any) {
  if(nextValue) {
    el.className = nextValue
  } else {
    el.removeAttribute("class")
  }
}

function patchStyle(el : HTMLElement,prevValue : any,nextValue : any) {
  if(prevValue) {
    for(let key in prevValue) {
      if(!nextValue[key]) {
        el.style[key] = undefined
      }
    }
  }
  for(let key in nextValue) {
    el.style[key] = nextValue[key]
  }
}

function patchEvent(el : Element,eventName : string,nextValue : any) {
  eventName = eventName.slice(2).toLowerCase()
  const bindInvokerEventMapping = el[PatchTagAttr.BIND_INVOKER_EVENT_MAPPING] || (el[PatchTagAttr.BIND_INVOKER_EVENT_MAPPING] = {})
  let invokerEvent = bindInvokerEventMapping[eventName]

  if(nextValue) {
    if(invokerEvent) {
      invokerEvent.event = nextValue
    } else {
      invokerEvent = (e : any) => invokerEvent.event(e)
      invokerEvent.event = nextValue
      bindInvokerEventMapping[eventName] = invokerEvent
      el.addEventListener(eventName,invokerEvent)
    }
  } else if(invokerEvent){
    el.removeEventListener(eventName,invokerEvent)
    bindInvokerEventMapping[eventName] = undefined
  }
}

function patchAttr(el : Element,key : string,nextValue : any) {
  if(nextValue) {
    el.setAttribute(key,nextValue)
  } else {
    el.removeAttribute(key)
  }
}

function patchProp(el : Element,key : string,prevValue : any,nextValue : any) {
  if(key === "class") {
    patchClass(el,nextValue)
  } else if(key === "style") {
    patchStyle(el as HTMLElement,prevValue,nextValue)
  } else if(/^on[A-Z]/.test(key)) {
    patchEvent(el,key,nextValue)
  } else {
    patchAttr(el,key,nextValue)
  }
}

export {
  patchProp
}