

# SimulationVue

SimulationVue 是一个学习了Vue3后的一个实现，包含了模板编译、响应式系统、虚拟 DOM 和组件渲染等核心功能。

## 核心特性

### 1. 响应式系统 (`@simulationvue/reactivity`)
- **ref**: 创建响应式引用
- **reactive**: 创建深度响应式对象
- **computed**: 计算属性，支持 getter 和 setter
- **effect**: 响应式副作用函数
- **watch**: 监听数据变化
- **effectScope**: 管理副作用作用域

### 2. 模板编译 (`@simulationvue/compiler-core`)
- **AST 解析**: 将模板字符串转换为抽象语法树
- **转换处理**: 节点转换优化
- **代码生成**: 生成渲染函数代码

### 3. 运行时核心 (`@simulationvue/runtime-core`)
- **组件系统**: 组件实例创建、属性初始化、插槽处理
- **生命周期**: onBeforeMount、onMounted、onBeforeUpdate、onUpdated
- **虚拟 DOM**: VNode 创建与 Diff 算法
- **调度器**: 异步任务队列管理
- **内置组件**: KeepAlive、Teleport

### 4. DOM 运行时 (`@simulationvue/runtime-dom`)
- **DOM 渲染**: 虚拟 DOM 到真实 DOM 的挂载与更新
- **属性处理**: class、style、event、attribute 的补丁更新

## 项目结构

```
packages/
├── compiler-core/      # 模板编译器
│   ├── src/
│   │   ├── ast.ts          # AST 定义
│   │   ├── parse.ts        # 解析器
│   │   ├── transform.ts    # 转换器
│   │   └── generate.ts     # 代码生成器
│   └── index.ts
├── reactivity/        # 响应式系统
│   ├── src/
│   │   ├── ref.ts          # 响应式引用
│   │   ├── reactive.ts     # 响应式对象
│   │   ├── computed.ts     # 计算属性
│   │   ├── effect.ts        # 副作用函数
│   │   ├── watch.ts         # 监听器
│   │   └── effectScope.ts   # 作用域管理
│   └── index.ts
├── runtime-core/      # 运行时核心
│   ├── src/
│   │   ├── component.ts     # 组件相关
│   │   ├── renderer.ts      # 渲染器
│   │   ├── vnode.ts         # 虚拟 DOM
│   │   ├── scheduler.ts     # 调度器
│   │   ├── lifecycle.ts     # 生命周期
│   │   ├── h.ts             # 虚拟节点创建
│   │   ├── apiInject.ts     # 依赖注入
│   │   ├── renderApi.ts     # 渲染 API
│   │   └── asyncComponent.ts # 异步组件
│   └── index.ts
├── runtime-dom/       # DOM 运行时
│   ├── src/
│   │   ├── nodeOps.ts       # DOM 操作
│   │   └── patchProp.ts     # 属性补丁
│   └── index.ts
└── shared/            # 共享工具
    ├── src/
    │   ├── utils.ts         # 工具函数
    │   ├── ShapeFlags.ts    # 形状标志
    │   └── patchFlags.ts    # 补丁标志
    └── index.ts
```

## 安装

### 环境要求
- Node.js >= 14
- TypeScript >= 4.0

### 安装依赖

```bash
npm install
```

### 开发构建

```bash
npm run dev
```

## 使用示例

### 1. 创建响应式数据

```typescript
import { ref, reactive, computed, effect } from '@simulationvue/reactivity'

// 使用 ref 创建基本类型响应式
const count = ref(0)
console.log(count.value) // 0
count.value++
console.log(count.value) // 1

// 使用 reactive 创建对象响应式
const state = reactive({
  count: 0,
  user: { name: 'Tom' }
})
state.count++

// 使用 computed 创建计算属性
const doubleCount = computed(() => count.value * 2)

// 使用 effect 监听响应式变化
effect(() => {
  console.log('count changed:', count.value)
})
```

### 2. 创建组件

```typescript
import { h, onMounted, onUpdated } from '@simulationvue/runtime-core'

// 函数式组件
const MyComponent = (props, { slots }) => {
  return h('div', { class: 'my-component' }, [
    h('h1', null, props.title),
    slots.default()
  ])
}

// 状态组件示例
const Counter = {
  props: {
    initial: Number, defaultCount: { type: 0 }
  },
  setup(props) {
    const count = ref(props.initialCount)
    
    const increment = () => {
      count.value++
    }
    
    onMounted(() => {
      console.log('Counter mounted!')
    })
    
    return () => h('button', { onClick: increment }, count.value)
  }
}
```

### 3. 渲染到 DOM

```typescript
import { createRenderer, h } from '@simulationvue/runtime-dom'
import { renderOptions } from '@simulationvue/runtime-dom/src/nodeOps'

const MyComponent = {
  setup() {
    return () => h('div', { class: 'container' }, 'Hello SimulationVue!')
  }
}

const vnode = h(MyComponent, null, null)
createRenderer(renderOptions).render(vnode, document.getElementById('app'))
```

### 4. 使用 KeepAlive 缓存组件

```typescript
import { KeepAlive, h } from '@simulationvue/runtime-core/components/KeepAlive'

const App = {
  setup() {
    const current = ref('A')
    return () => h('div', [
      h('button', { onClick: () => current.value = 'A' }, 'Show A'),
      h('button', { onClick: () => current.value = 'B' }, 'Show B'),
      h(KeepAlive, { include: ['A', 'B'] }, () => {
        return current.value === 'A' 
          ? h(ComponentA) 
          : h(ComponentB)
      })
    ])
  }
}
```

## API 参考

### 响应式 API

| API | 描述 |
|-----|------|
| `ref(value)` | 创建响应式引用 |
| `reactive(obj)` | 创建深度响应式对象 |
| `computed(getter)` | 创建计算属性 |
| `effect(fn)` | 执行副作用函数 |
| `watch(source, callback)` | 监听数据变化 |
| `effectScope()` | 创建副作用作用域 |

### 生命周期钩子

| 钩子 | 触发时机 |
|-----|---------|
| `onBeforeMount` | 组件挂载之前 |
| `onMounted` | 组件挂载完成后 |
| `onBeforeUpdate` | 组件更新之前 |
| `onUpdated` | 组件更新完成后 |

### 虚拟 DOM API

| API | 描述 |
|-----|------|
| `h(type, props, children)` | 创建虚拟节点 |
| `createVnode(type, props, children)` | 创建 VNode |
| `openBlock()` | 开启块级优化 |
| `toDisplayString(val)` | 转换为显示字符串 |

## 开发指南

### 添加新功能

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feat/your-feature`)
3. 提交更改 (`git commit -m 'feat: add some feature'`)
4. 推送到分支 (`git push origin feat/your-feature`)
5. 创建 Pull Request

### 运行测试

```bash
npm run test
```

## 许可证

本项目基于 MIT 许可证开源。

## 参考

- Vue.js 3 官方文档: https://v3.vuejs.org/
- 响应式系统设计参考了 Vue 3 的实现原理
- 模板编译参考了 Vue 3 的 compiler-core 实现