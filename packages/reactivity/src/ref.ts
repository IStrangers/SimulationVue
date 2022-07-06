import { isArray, isObject } from "../../shared/src/utils"
import { ReactiveEffect, trackEffects, triggerEffects } from "./effect"
import { isReactive, reactive, ReactiveTagAttr } from "./reactive"

function toReactiveValue(value : any) {
    if(isObject(value) && isReactive(value) === false) {
        return value = reactive(value)
    }
    return value
}

class RefImpl {
    public deps : Set<ReactiveEffect> = new Set()
    public __value__ : any
    public __isRef__ : boolean = true
    constructor(public originValue : any) {
        this.__value__ = toReactiveValue(originValue)
    }

    get value() {
        trackEffects(this.deps)
        return this.__value__
    }

    set value(value : any) {
        if(value !== this.originValue) {
            this.__value__ = toReactiveValue(value)
            this.originValue = value
            triggerEffects(this.deps)
        }
    }

}

function ref(value : any) {
    return new RefImpl(value)
}


class ObjectRefImpl<T extends object> {
    public __isRef__ : boolean = true
    constructor(public originValue : T,public key : string | symbol) {

    }
    get value() {
        return this.originValue[this.key]
    }
    set value(value : any) {
        this.originValue[this.key] = value
    }
}

function toRef<T extends object>(value : T,key : string | symbol) {
    return new ObjectRefImpl(value,key)
}

function toRefs<T extends object>(value : T) : any {
    const result : any = isArray(value) ? new Array((value as Array<any>).length) : {}
    for(let key in value) {
        result[key] = toRef(value,key)
    }
    return result
}

function proxyRefs<T extends object>(value : T) {
    return new Proxy(value,{
        get(target,key,recevier) {
            const r = Reflect.get(target,key,recevier)
            return r[ReactiveTagAttr.IS_REF] ? r.value : r
        },
        set(target,key,value,recevier) {
            let oldValue = target[key]
            if(oldValue[ReactiveTagAttr.IS_REF]) {
                oldValue.value = value
                return true
            } else {
                return Reflect.set(target,key,value,recevier)
            }
        }
    })
}

export {
    ref,
    toRef,
    toRefs,
    proxyRefs,
}