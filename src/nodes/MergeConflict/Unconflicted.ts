import { NodeSpec, Node } from "prosemirror-model";
import NodeWithNodeView from "../NodeWithNodeView";
import { NodeViewConstructor } from "../..";
import { NodeView, EditorView } from "prosemirror-view";
import { mergeSectionThemes } from "./MergeSection";
import { MarkdownSerializerState } from "prosemirror-markdown";

const passiveOpacity = "66"

class Unconflicted extends NodeWithNodeView {

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
      const dom = document.createElement('div')
      dom.className = "unconflictedDOM"
      dom.style.display = 'flex'
      dom.style.flexDirection = "column"

      const contentDOM = document.createElement('div')
      contentDOM.className = "unconflictedContentDOM"
      contentDOM.style.flex = '1'
      contentDOM.appendChild(document.createElement("marquee"))

      if (node.attrs.originalConflict && typeof getPos === "function") {
        this.makeAbleToUnresolve(dom, node, view, getPos)
      }

      dom.appendChild(contentDOM)

      return { dom, contentDOM }
    }
  }

  private makeAbleToUnresolve = (dom: HTMLDivElement, node: Node, view: EditorView, getPos: () => number): void => {
    const { originalConflict, chosenIdentity } = node.attrs

    dom.title = "Unresolve"
    dom.style.transition = "300ms ease all"
    dom.style.cursor = "pointer"

    const { backgroundLight: active } = mergeSectionThemes[chosenIdentity]
    const passive = active + passiveOpacity

    dom.style.background = passive

    dom.addEventListener("pointerenter", () => dom.style.background = active)
    dom.addEventListener("pointerleave", () => dom.style.background = passive)
    dom.addEventListener("click", () => {
      const pos = getPos()
      view.state.doc.attrs.conflictCount += 1
      view.dispatch(view.state.tr.replaceRangeWith(pos, pos + node.nodeSize, originalConflict))
    })
  }

  toMarkdown(state: MarkdownSerializerState, node: Node) {
    state.renderContent(node)
  }

}

export default Unconflicted