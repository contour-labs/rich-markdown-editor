import { NodeSpec, Fragment, Node } from "prosemirror-model";
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
      const { identity } = node.attrs

      const dom = document.createElement('div')
      dom.style.display = 'flex'
      dom.style.flexDirection = "column"

      const contentDOM = document.createElement('div')
      contentDOM.style.flex = '1'
      contentDOM.style.padding = "5px 10px"
      contentDOM.style.background = identity === ConflictIdentity.CURRENT ? "#dcfce6" : "#e0e7ff"

      const blankConflictSegment = () => {
        const p = document.createElement("p")
        p.style.fontWeight = "500"
        p.style.padding = "5px 10px"
        p.style.cursor = "pointer"
        return p
      }

      const handler = (generateUnconflicted: (self: Node, parent: Node) => Node) => {
        view.state.doc.descendants((parentCandidate, pos) => {
          const { type, attrs } = parentCandidate
          if (type.name === "merge_conflict" && attrs.conflictId === node.attrs.conflictId) {
            const conflicted = generateUnconflicted(node, parentCandidate)
            view.dispatch(view.state.tr.replaceRangeWith(pos, pos + parentCandidate.nodeSize, conflicted))
          }
        })
      }

      const blankUnconflicted = (content?: Fragment): Node => {
        return view.state.schema.nodes.unconflicted.create({}, content)
      }

      const labelledMargin = blankConflictSegment()
      labelledMargin.addEventListener("click", () => handler(self => blankUnconflicted(self.content)))

      if (identity === ConflictIdentity.CURRENT) {
        // Initialize and render the opening "<<<<<<<" panel
        labelledMargin.textContent = "<<<<<<< HEAD"
        labelledMargin.style.color = "#17a34a"
        labelledMargin.style.background = "#baf7d0"
        dom.appendChild(labelledMargin)
        // Then, render the markdown child content
        dom.appendChild(contentDOM)
      } else {
        // Initialize and render the middle "=======" panel
        const separator = blankConflictSegment()
        separator.textContent = "======="
        separator.style.color = "#eab305"
        separator.style.background = "#fefce8"
        separator.addEventListener("click", () => {
          handler((self, parent) => blankUnconflicted(Fragment.fromArray([
            blankUnconflicted(parent.firstChild?.content),
            blankUnconflicted(self.content),
          ])))
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
