import { isFunction, isObject } from "../../util"
import { ReactiveEffect } from "./effect"
import { isReactive } from "./reactive"

function traversal(value : any,cache = new Set()) {
    if(isObject(value) == false) {
        return value
    }
    if(cache.has(value)) {
        return value
    }
    cache.add(value)
    for(let key in value) {
        traversal(value[key],cache)
    }
    return value
}

function watch<T extends object>(value : T | Function,callback : Function) {
    let getter
    if(isObject(value)) {
        if(isReactive(value) == false) {
            return
        }
        getter = () => traversal(value)
    } else if(isFunction(value)) {
        getter = value as Function
    } else {
        return
    }
    let clear : Function
    const onClear = (fn : Function) => {
        clear = fn
    }
    let oldValue : any
    const scheduler = () => {
        clear && clear()
        const newValue = reactiveEffect.run()
        callback(oldValue,newValue,onClear)
        oldValue = newValue
    }
    const reactiveEffect = new ReactiveEffect(getter,scheduler)
    oldValue = reactiveEffect.run()
}

export {
    watch
}