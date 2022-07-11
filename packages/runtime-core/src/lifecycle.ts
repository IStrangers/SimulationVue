import { ComponentInstance, getCurrentComponentInstance } from "./component"

enum LifecycleHooks {
    BEFORE_MOUNT = "__beforeMount__",
    MOUNTED = "__mounted__",
    BEFORE_UPDATE = "__beforeUpdate__",
    UPDATEED = "__updated__",
}

function createHook(type : LifecycleHooks) {
    return (hook : Function,target : ComponentInstance | null = getCurrentComponentInstance()) => {
        if(target) {
            const hooks = target[type] || (target[type] = [])
            hooks.push(() => hook(target))
        }
    }
}

const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)


const onMounted = createHook(LifecycleHooks.MOUNTED)

const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)


const onUpdated = createHook(LifecycleHooks.UPDATEED)

export {
    LifecycleHooks,
    onBeforeMount,
    onMounted,
    onBeforeUpdate,
    onUpdated,
}