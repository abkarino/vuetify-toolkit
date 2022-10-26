export default function treeviewScopedSlots (slots: any): object {
  let result = {}
  if (slots.prependTree) {
    result = Object.assign(result, { prepend: (props: any) => slots.prependTree(props) })
  }
  if (slots.appendTree) {
    result = Object.assign(result, { append: (props: any) => slots.appendTree(props) })
  }
  if (slots.labelTree) {
    result = Object.assign(result, { label: (props: any) => slots.labelTree(props) })
  }
  return result
}
