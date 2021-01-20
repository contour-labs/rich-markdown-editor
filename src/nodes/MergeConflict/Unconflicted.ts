import { NodeSpec, Node } from "prosemirror-model";
import NodeWithNodeView from "../NodeWithNodeView";
import { NodeViewConstructor } from "../..";
import { NodeView } from "prosemirror-view";
import { mergeSectionThemes } from "./MergeSection";
import { MarkdownSerializerState } from "prosemirror-markdown";

export default class Unconflicted extends NodeWithNodeView {

  get name() {
    return "unconflicted";
  }

  get schema(): NodeSpec {
    return {
      content: "block*",
      group: "block",
      attrs: {
        originalConflict: {
          default: undefined
        },
        chosenIdentity: {
          default: undefined
        }
      }
    };
  }

  get nodeViewConstructor(): NodeViewConstructor {
    return (node, view, getPos): NodeView => {
      const { originalConflict, chosenIdentity } = node.attrs

      const dom = document.createElement('div')
      dom.style.display = 'flex'
      dom.style.flexDirection = "column"

      const contentDOM = document.createElement('div')
      contentDOM.style.flex = '1'

      if (originalConflict && typeof getPos === "function") {
        dom.title = "Unresolve"
        const { backgroundLight: active } = mergeSectionThemes[chosenIdentity]
        const passive = active + "66"
        dom.addEventListener("pointerenter", () => {
          dom.style.background = active
        })
        dom.addEventListener("pointerleave", () => {
          dom.style.background = passive
        })
        dom.style.background = passive
        dom.style.transition = "300ms ease all"
        dom.style.cursor = "pointer"
        dom.addEventListener("click", () => {
          const pos = getPos()
          view.state.doc.attrs.conflictCount += 1
          view.dispatch(view.state.tr.replaceRangeWith(pos, pos + node.nodeSize, originalConflict))
        })
      }

      dom.appendChild(contentDOM)

      return { dom, contentDOM }
    }
  }

  toMarkdown(state: MarkdownSerializerState, node: Node) {
    state.renderContent(node)
  }

}
