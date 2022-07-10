import { reactive } from "../../reactivity"
import { hasOwnProperty, isFunction } from "../../shared"
import { Vnode } from "./vnode"

interface ComponentInstance {
    propsOptions : object
    props: object
    attrs: object
    data : object
    vnode: Vnode
    subTree: Vnode | null,
    isMounted: boolean
    render: Function
    update: Function
    proxy: object
}

function createComponentInstance(vnode : Vnode) : ComponentInstance {
    const {
        props:propsOptions = {},
        data = () => ({}),
        render = () => {},
    } = vnode.type
    
    const instance = {
        propsOptions,
        props: {},
        attrs: {},
        data : {},
        vnode,
        subTree: null,
        isMounted: false,
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
    return instance
}

function initProps(instance : any,rawProps : any) {
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

const publicPropertyMap = {
    $attrs: (i : any) => i.attrs
}
function initProxy(instance : any) {
    instance.proxy = new Proxy(instance,{
        get(target,key) {
            const {data,props} = target
            if(data && hasOwnProperty(data,key)) {
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
            const {data,props} = target
            if(data && hasOwnProperty(data,key)) {
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
    createComponentInstance,
}