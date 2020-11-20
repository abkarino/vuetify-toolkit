import { VNodeData, VNode, VNodeChildren } from 'vue'
import { getObjectValueByPath } from '../../vuetify-import'
import VCascaderSelectList from './VCascaderSelectList'
import commonSelect from '../mixin/commonSelect'

/* @vue/component */
export default commonSelect.extend({
  name: 'v-cascader',
  props: {
    itemKey: {
      type: String,
      default: 'id'
    },
    itemChildren: {
      type: [String, Function],
      default: 'children'
    },
    itemText: {
      type: [String, Array, Function],
      default: 'text'
    },
    showFullPath: {
      type: Boolean,
      default: true
    },
    delimeter: {
      type: [String],
      default: ','
    }
  },
  data: (vm: any) => ({
    currentNode: null,
    parents: new Map(),
    childNodes: new Map(),
    treeviewCashe: new Map(),
    currentParents: [] as any[],
    currentParentKey: undefined
  }),
  computed: {
    computedItems (): any[] {
      return (this as any).$data.childNodes.get((this as any).currentParentKey)
      // return (this as any).buildTree((this as any).$props.items)
    },
    computedChildren (): any[] {
      if (!(this as any).$data.currentParentKey) return (this as any).computedItems
      const localChildren = (this as any).$data.treeviewCashe.get((this as any).$data.currentParentKey)
      return localChildren
    },
    listData (): VNodeData {
      const scopeId = this.$vnode && (this.$vnode as any).context.$options._scopeId
      return {
        attrs: scopeId ? {
          [scopeId]: true
        } : undefined,
        props: {
          action: this.multiple && !this.isHidingSelected,
          dark: this.dark,
          color: this.color,
          dense: this.dense,
          hideSelected: this.hideSelected,
          items: this.computedChildren,
          noDataText: this.noDataText,
          selectedItems: this.selectedItems,
          itemAvatar: this.itemAvatar,
          itemDisabled: this.itemDisabled,
          itemValue: this.itemValue,
          itemText: (this as any).$props.itemText,
          parents: this.currentParents
        },
        on: {
          select: (item: object) => {
            (this as any).selectItem(item)
          },
          'select-parent': (item: object) => {
            (this as any).selectParent(item)
          }
        },
        scopedSlots: {
          item: (this.$scopedSlots as any).item
        }
      }
    },
    staticList (): VNode {
      // if (this.$slots['no-data'] || this.$slots['prepend-item'] || this.$slots['append-item']) {
      //   consoleError('assert: staticList should not be called if slots are used')
      // }
      const slots: VNodeChildren = []
      slots.push((this.$scopedSlots as any).items)
      return (this as any).$createElement(VCascaderSelectList, this.listData, slots)
    }
  },
  watch: {
    items: {
      immediate: true,
      handler (val) {
        (this as any).buildTree(val, undefined)
      }
    }
  },
  methods: {
    buildTree (items: any, parentkey?: any): any[] {
      if (this.$data.childNodes.has(parentkey)) return this.$data.childNodes.get(parentkey)
      const newItems: any[] = []
      items.map((item: any) => {
        const localChildren = getObjectValueByPath(item, this.$props.itemChildren, [])
        const itemKey = getObjectValueByPath(item, this.$props.itemKey, [])
        if (localChildren.length > 0) {
          const newChildren = (this as any).buildTree(localChildren, itemKey)
          const clone = Object.assign({}, item)
          clone[this.$props.itemChildren] = newChildren
          clone.hasChildren = true
          newItems.push(clone)
          this.$data.treeviewCashe.set(itemKey, localChildren)
          this.$data.parents.set(itemKey, parentkey)
        } else {
          this.$data.parents.set(itemKey, parentkey)
        }
      })
      this.$data.childNodes.set(parentkey, newItems)
      return newItems
    },
    getParents (key: number|string): any[] {
      const result = []
      const parent = this.$data.parents.get(key)
      if (parent) {
        result.push(parent)
        const p = (this as any).getParents(parent)
        result.push(...p)
      }
      return result
    },
    genListWithSlot (): VNode {
      const slots = ['prepend-item', 'no-data', 'append-item']
        .filter(slotName => this.$slots[slotName])
        .map(slotName => this.$createElement('template', {
          slot: slotName
        }, this.$slots[slotName]))
      // Requires destructuring due to Vue
      // modifying the `on` property when passed
      // as a referenced object
      return this.$createElement(VCascaderSelectList, ({ ...this.listData }) as VNodeData, slots)
    },
    selectItem (item: object) {
      const itemKey = getObjectValueByPath(item, this.$props.itemKey, [])
      const chld = (this as any).$data.treeviewCashe.get(itemKey)
      if (chld) {
        this.$data.currentParentKey = itemKey
        this.$data.currentParents.push(item)
      } else {
        // selected item
        let txt = ''
        if (this.$props.showFullPath) {
          this.$data.currentParents.map((v:any) => {
            txt += (this as any).getText(v) + this.$props.delimeter
          })
        }
        txt += (this as any).getText(item)
        const itemToAdd = { name: txt }
        if (this.$props.multiple && this.$data.selectedItems.indexOf(itemToAdd) === -1) {
          this.$data.selectedItems.push(itemToAdd)
        } else if (!this.$props.multiple) {
          this.$data.selectedItems = [itemToAdd]
        }
        this.$data.currentParentKey = undefined
        this.$data.currentParents = []
      }
    },
    selectParent (item: object) {
      let itemKey = getObjectValueByPath(item, this.$props.itemKey, [])
      this.$data.currentParentKey = this.$data.parents.get(itemKey)
      this.$data.currentParents = []
      while (true) {
        const p = this.$data.parents.get(itemKey)
        if (p) {
          this.$data.currentParents.unshift(p)
          itemKey = p
        } else break
      }
    }
  }
})
