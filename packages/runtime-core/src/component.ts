import { proxyRefs, reactive } from "../../reactivity"
import { hasOwnProperty, isFunction, isObject } from "../../shared"
import { Vnode } from "./vnode"

interface ComponentInstance {
    propsOptions : object
    props: object
    attrs: object
    data : object
    vnode: Vnode
    newVnode: Vnode | null
    subTree: Vnode | null
    isMounted: boolean
    setupState: object,
    render: Function
    update: Function
    proxy: object
}

function createComponentInstance(vnode : Vnode) : ComponentInstance {
    const {
        props:propsOptions = {},
        data = () => ({}),
        render = () => {},
        setup,
    } = vnode.type
    
    const instance = {
        propsOptions,
        props: {},
        attrs: {},
        data : {},
        vnode,
        newVnode: null,
        subTree: null,
        isMounted: false,
        setupState: {},
        render,
        update: () => {},
        proxy: {},
    }

    initProps(instance,vnode.props)
    initProxy(instance)

    if(isFunction(data) === false) {
        throw new Error(`data option must be a function`)
    }
    instance.data = reactive(data.call(instance.proxy))

    if(setup) {
        const setupContext = {}
        const setupResult = setup(instance.props,setupContext)
        if(isFunction(setupContext)) {
            instance.render = setupResult
        } else if(isObject(setupResult)) {
            instance.setupState = proxyRefs(setupResult)
        }
    }
    return instance
}

function initProps(instance : ComponentInstance,rawProps : any) {
    const props = {}
    const attrs = {}

    const options = instance.propsOptions || {}
    
    if(rawProps) {
        for(let key in rawProps) {
            const value = rawProps[key]
            if(hasOwnProperty(options,key)) {
                props[key] = value
            } else {
                attrs[key] = value
            }
        }
    }

    instance.props = reactive(props)
    instance.attrs = attrs
}

function hasPropsChanged(oldProps : any = {},newProps : any = {}) : boolean{
    const newKeys = Object.keys(newProps)
    if(newKeys.length !== Object.keys(oldProps).length) {
        return true
    }
    for(let i = 0; i < newKeys.length; i++) {
        const key = newKeys[i]
        if(newProps[key] !== oldProps[key]) {
            return true
        }
    }
    return false
}

function updateProps(componentInstance : ComponentInstance,newProps : any) {
    for(let key  in newProps) {
        componentInstance.props[key] = newProps[key]
    }
    for(let key  in componentInstance.props) {
        if(hasOwnProperty(newProps,key) === false) {
            delete componentInstance.props[key]
        }
    }
}

const publicPropertyMap = {
    $attrs: (i : any) => i.attrs
}
function initProxy(instance : ComponentInstance) {
    instance.proxy = new Proxy(instance,{
        get(target,key) {
            const {setupState,data,props} = target
            if(setupState && hasOwnProperty(setupState,key)) {
                return setupState[key]
            }else if(data && hasOwnProperty(data,key)) {
                return data[key]
            } else if(props && hasOwnProperty(props,key)){
                return props[key]
            }
            const getter = publicPropertyMap[key]
            if(getter) {
                return getter(target)
            }
        },
        set(target,key,value) {
            const {setupState,data,props} = target
            if(setupState && hasOwnProperty(setupState,key)) {
                setupState[key] = value
                return true
            }else if(data && hasOwnProperty(data,key)) {
                data[key] = value
                return true
            } else if(props && hasOwnProperty(props,key)){
                console.warn(`attemption to mutate prop ${key as string}`)
                return false
            }
            return true
        }
    });
}

export {
    ComponentInstance,
    createComponentInstance,
    hasPropsChanged,
    updateProps,
}