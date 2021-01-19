import { NodeSpec } from "prosemirror-model";
import NodeWithNodeView from "./NodeWithNodeView";
import { NodeViewConstructor } from "..";
import { NodeView } from "prosemirror-view";
import { mergeSectionThemes } from "./MergeSection";

export default class Unconflicted extends NodeWithNodeView {

  get name() {
    return "unconflicted";
  }

  get schema(): NodeSpec {
    return {
      content: "inline*",
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
        dom.addEventListener("pointerenter", () => {
          dom.style.background = mergeSectionThemes[chosenIdentity].backgroundLight
        })
        dom.addEventListener("pointerleave", () => {
          dom.style.background = "white"
        })
        dom.style.transition = "300ms ease all"
        dom.style.cursor = "pointer"
        dom.addEventListener("click", () => {
          const pos = getPos()
          view.dispatch(view.state.tr.replaceRangeWith(pos, pos + node.nodeSize, originalConflict))
        })
      }

      dom.appendChild(contentDOM)

      return { dom, contentDOM }
    }
  }

}
