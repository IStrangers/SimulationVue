import { ref } from "../../reactivity"
import { isFunction } from "../../shared";
import { h } from "./h";

function defineAsyncComponent(options: any) {
    if(isFunction(options)) {
      options = {
        loader: options
      }
    }

    const { 
      delay,
      loadingComponent,
      loader,
      timeout,
      errorComponent,
      onError,
    } = options

    return {
      setup() {
        const loading = ref(false)
        const loaded = ref(false)
        const error = ref(false)
        let renderComponent : object | null = null

        delay && setTimeout(() => loading.value = true,delay)

        callLoader(loader,onError)
        .then((component : object) => {
          renderComponent = component
          loaded.value = true
        })
        .catch((err : any) => error.value = err)
        .finally(() => loading.value = false)

        setTimeout(() => error.value = true,timeout)

        return () => {
          if(loading.value && loadingComponent) {
            h(loadingComponent)
          } else if(loaded.value && renderComponent) {
            h(renderComponent)
          } else if(error.value && errorComponent){
            h(errorComponent)
          }
        }
      }
    }
}

function callLoader(loader : Function,onError : Function) {
  return loader().catch((err : any) => {
    if(onError) {
      return new Promise((resolve,reject) => {
        const retry = () => {
          resolve(callLoader(loader,onError))
        }
        const fail = () => {
          reject(err)
        }
        onError(err,retry,fail)
      })
    }
  })
}

export {
  defineAsyncComponent,
}