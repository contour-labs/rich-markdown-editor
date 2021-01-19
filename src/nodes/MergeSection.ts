import { NodeSpec } from "prosemirror-model";
import NodeWithNodeView from "./NodeWithNodeView";
import { NodeView } from "prosemirror-view";
import { NodeViewConstructor } from "..";
import { ConflictIdentity } from "./MergeConflict";
import { NodeSelection } from "prosemirror-state";

export default class MergeSection extends NodeWithNodeView {

  get name() {
    return "merge_section";
  }

  get schema(): NodeSpec {
    return {
      content: "inline*",
      group: "block",
      attrs: {
        identity: {
          default: undefined
        },
        conflictId: {
          default: undefined
        }
      }
    };
  }

  get nodeViewConstructor(): NodeViewConstructor {
    return (node, view): NodeView => {
      console.log("CALLED!", node.attrs)
      const { identity, selected } = node.attrs

      const dom = document.createElement('div')
      dom.style.display = 'flex'
      dom.style.flexDirection = "column"

      const contentDOM = document.createElement('div')
      contentDOM.style.flex = '1'

      if (selected) {
        dom.appendChild(contentDOM)
        return { dom, contentDOM }
      }

      contentDOM.style.padding = "5px 10px"
      contentDOM.style.background = identity === ConflictIdentity.CURRENT ? "#dcfce6" : "#e0e7ff"

      const blankConflictSegment = () => {
        const p = document.createElement("p")
        p.style.fontWeight = "500"
        p.style.padding = "5px 10px"
        p.style.cursor = "pointer"
        return p
      }

      const labelledMargin = blankConflictSegment()

      const handler = () => {
        labelledMargin.remove()
        contentDOM.style.background = "white"
        contentDOM.style.padding = "0"
        node.attrs.selected = true
        view.state.doc.descendants((nodeCandidate, pos) => {
          const { type, attrs } = nodeCandidate
          if (type.name === "merge_conflict" && attrs.conflictId === node.attrs.conflictId) {
            view.dispatch(view.state.tr.replaceRangeWith(pos, pos + nodeCandidate.nodeSize, node))
          }
        })
      }

      if (identity === ConflictIdentity.CURRENT) {
        // Initialize and render the opening "<<<<<<<" panel
        labelledMargin.textContent = "<<<<<<< HEAD"
        labelledMargin.style.color = "#17a34a"
        labelledMargin.style.background = "#baf7d0"
        labelledMargin.addEventListener("click", handler)
        dom.appendChild(labelledMargin)
        // Then, render the markdown child content
        dom.appendChild(contentDOM)
      } else {
        // Initialize and render the middle "=======" panel
        const separator = blankConflictSegment()
        separator.textContent = "======="
        separator.style.color = "#eab305"
        separator.style.background = "#fefce8"
        labelledMargin.addEventListener("click", () => {
          separator.remove()
          handler()
        })
        separator.addEventListener("click", () => {
          console.log("You've chosen to resolve both. Come back later...")
        })
        dom.appendChild(separator)
        // Then, render the markdown child content
        dom.appendChild(contentDOM)
        // Finally, initialize and render the trailing ">>>>>>>" panel
        labelledMargin.textContent = ">>>>>>>"
        labelledMargin.style.color = "#4e46e4"
        labelledMargin.style.background = "#c6d2fe"
        dom.appendChild(labelledMargin)
      }

      return { dom, contentDOM }
    }
  }

}
