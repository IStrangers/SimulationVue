import { ReactiveEffect } from "./effect"

let activeEffectScope : EffectScope | null
class EffectScope {
  active = true
  parentEffectScope : EffectScope | null = null
  effects : Array<ReactiveEffect> = []
  scopes : Array<EffectScope> = []

  constructor(detached : boolean) {
    if(!detached && activeEffectScope) {
      activeEffectScope.scopes.push(this)
    }
  }

  run(fn : Function) {
    if(this.active) {
      try {
        this.parentEffectScope = activeEffectScope
        activeEffectScope = this
        return fn()
      } finally {
        activeEffectScope = this.parentEffectScope
      }
    }
  }
  stop() {
    if(this.active) {
      for(let effect of this.effects) {
        effect.stop()
      }
      for(let scopes of this.scopes) {
        scopes.stop()
      }
      this.active = false
    }
  }
}
function recordEffectScope(effect : ReactiveEffect) {
  if(activeEffectScope && activeEffectScope.active) {
    activeEffectScope.effects.push(effect)
  }
}

function effectScope(detached : boolean = false) {
  return new EffectScope(detached)
}

export {
  effectScope,
  recordEffectScope,
}