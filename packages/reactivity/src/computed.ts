import { isFunction } from "../../util"
import { ReactiveEffect, trackEffects, triggerEffects } from "./effect"

const readonlySet = () => console.warn("not implemented setter")

class ComputedRefImpl {
    public effect : ReactiveEffect | null = null
    public deps : Set<ReactiveEffect> = new Set()
    public __dirty__ : boolean = true
    public __isReadonly__ : boolean = true
    public __isRef__ : boolean = true
    public __value__ : any = null
    constructor(public getter : Function,public setter : Function) {
        this.__isReadonly__ = setter === readonlySet
        this. effect = new ReactiveEffect(getter,() => {
            if(this.__dirty__ == false) {
                this.__dirty__ = true
                triggerEffects(this.deps)
            }
        })
    }

    get value() {
        trackEffects(this.deps)
        if(this.__dirty__) {
            this.__dirty__ = false
            this.__value__ = this.effect?.run()
        }
        return this.__value__
    }

    set value(value : any) {
        this.setter(value)
    }

}

interface ComputedOptions {
    get : Function
    set : Function
}

function computed(getterOrOptions : Function | ComputedOptions) {
    let getter : Function
    let setter : Function
    if(isFunction(getterOrOptions)) {
        getter = getterOrOptions as Function
        setter = readonlySet
    } else {
        const {get,set} = {...getterOrOptions as ComputedOptions}
        getter = get
        setter = set
    }
    return new ComputedRefImpl(getter,setter)
}

export {
    computed
}