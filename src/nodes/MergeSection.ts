import { NodeSpec, Fragment, Node } from "prosemirror-model";
import NodeWithNodeView from "./NodeWithNodeView";
import { NodeView } from "prosemirror-view";
import { NodeViewConstructor } from "..";
import { ConflictIdentity } from "./MergeConflict";

export const mergeSectionThemes = {
  [ConflictIdentity.CURRENT]: {
    color: "#17a34a",
    backgroundLight: "#dcfce6",
    backgroundDark: "#baf7d0",
  },
  [ConflictIdentity.INCOMING]: {
    color: "#4e46e4",
    backgroundLight: "#e0e7ff",
    backgroundDark: "#c6d2fe",
  },
  [ConflictIdentity.BOTH]: {
    color: "#eab305",
    backgroundLight: "#fefce8",
    backgroundDark: "#fefce8",
  }
}

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
      contentDOM.style.background = mergeSectionThemes[identity].backgroundLight

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

      const blankUnconflicted = (content: Fragment | undefined, conflictInfo: { originalConflict: Node, chosenIdentity: ConflictIdentity } | undefined): Node => {
        return view.state.schema.nodes.unconflicted.create(conflictInfo, content)
      }

      const labelledMargin = blankConflictSegment()
      labelledMargin.title = `Accept ${identity}`
      labelledMargin.addEventListener("click", () => handler((self, parent) => {
        const attrs = { originalConflict: parent, chosenIdentity: identity }
        return blankUnconflicted(self.content, attrs)
      }))

      if (identity === ConflictIdentity.CURRENT) {
        // Initialize and render the opening "<<<<<<<" panel
        labelledMargin.textContent = "<<<<<<< HEAD"
        const currentTheme = mergeSectionThemes[ConflictIdentity.CURRENT]
        labelledMargin.style.color = currentTheme.color
        labelledMargin.style.background = currentTheme.backgroundDark
        dom.appendChild(labelledMargin)
        // Then, render the markdown child content
        dom.appendChild(contentDOM)
      } else {
        // Initialize and render the middle "=======" panel
        const separator = blankConflictSegment()
        separator.textContent = "======="
        const bothTheme = mergeSectionThemes[ConflictIdentity.BOTH]
        separator.style.color = bothTheme.color
        separator.style.background = bothTheme.backgroundDark
        separator.title = "Accept Both"
        separator.addEventListener("click", () => {
          handler((self, parent) => {
            const attrs = { originalConflict: parent, chosenIdentity: ConflictIdentity.BOTH }
            return blankUnconflicted(Fragment.fromArray([
              blankUnconflicted(parent.firstChild?.content, undefined),
              blankUnconflicted(self.content, undefined),
            ]), attrs)
          })
        })
        dom.appendChild(separator)
        // Then, render the markdown child content
        dom.appendChild(contentDOM)
        // Finally, initialize and render the trailing ">>>>>>>" panel
        labelledMargin.textContent = ">>>>>>>"
        const incomingTheme = mergeSectionThemes[ConflictIdentity.INCOMING]
        labelledMargin.style.color = incomingTheme.color
        labelledMargin.style.background = incomingTheme.backgroundDark
        dom.appendChild(labelledMargin)
      }

      return { dom, contentDOM }
    }
  }

}
