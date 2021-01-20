import { NodeSpec, Fragment, Node } from "prosemirror-model";
import NodeWithNodeView from "../NodeWithNodeView";
import { NodeView } from "prosemirror-view";
import { NodeViewConstructor } from "../..";
import { ConflictIdentity } from "./MergeConflict";

interface Theme {
  color: string
  backgroundLight: string
  backgroundDark: string
}

export const mergeSectionThemes: { [identity: string]: Theme } = {
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

interface UnconflictedAttrs {
  originalConflict: Node,
  chosenIdentity: ConflictIdentity
}

type ClickHandler = (generateUnconflicted: (self: Node, parent: Node) => Node) => void

class MergeSection extends NodeWithNodeView {

  get name() {
    return "merge_section";
  }

  get schema(): NodeSpec {
    return {
      content: "block*",
      group: "block",
      selectable: false,
      attrs: {
        identity: {
          default: undefined
        },
        conflictId: {
          default: undefined
        },
        commitHash: {
          default: undefined
        }
      }
    };
  }

  get nodeViewConstructor(): NodeViewConstructor {
    return (node, view): NodeView => {
      const { identity, conflictId } = node.attrs

      const dom = document.createElement('div')
      dom.style.display = 'flex'
      dom.style.flexDirection = "column"

      const contentDOM = document.createElement('div')
      contentDOM.style.flex = '1'
      contentDOM.style.padding = "5px 10px"
      contentDOM.style.background = mergeSectionThemes[identity].backgroundLight

      const handler = (generateUnconflicted: (self: Node, parent: Node) => Node): void => {
        view.state.doc.attrs.conflictCount -= 1
        view.state.doc.descendants((parentCandidate, pos) => {
          const { type, attrs } = parentCandidate
          if (type.name === "merge_conflict" && attrs.conflictId === conflictId) {
            const unconflicted = generateUnconflicted(node, parentCandidate)
            view.dispatch(view.state.tr.replaceRangeWith(pos, pos + parentCandidate.nodeSize, unconflicted))
          }
        })
      }

      const createUnconflictedFrom = (content?: Fragment, conflictInfo?: UnconflictedAttrs): Node => {
        return view.state.schema.nodes.unconflicted.create(conflictInfo, content)
      }

      // This is an initially generic partitioner, but will be initialized
      // as either a head or a tail depending on this node's attributes
      const partitioner = this.createPartitioner()

      const clickContainer = document.createElement("div")
      clickContainer.title = `Accept ${identity}`
      clickContainer.style.cursor = "pointer"
      clickContainer.addEventListener("click", () => handler((self, parent) => {
        return createUnconflictedFrom(self.content, {
          originalConflict: parent,
          chosenIdentity: identity
        })
      }))

      if (identity === ConflictIdentity.CURRENT) {
        this.formatHead(partitioner)
        clickContainer.appendChild(partitioner)
        clickContainer.appendChild(contentDOM)
      } else {
        this.formatTail(partitioner)
        // The middle partitioner is arbitrarily placed above the tail, but
        // it could just as easily be below the head
        dom.appendChild(this.createMiddle(handler, createUnconflictedFrom))
        clickContainer.appendChild(contentDOM)
        clickContainer.appendChild(partitioner)
      }

      dom.appendChild(clickContainer)

      return { dom, contentDOM }
    }
  }

  private createPartitioner = (): HTMLParagraphElement => {
    const p = document.createElement("p")
    p.style.cursor = "pointer"
    p.style.fontWeight = "500"
    p.style.padding = "5px 10px"
    return p
  }

  private formatHead = (head: HTMLDivElement): void => {
    head.textContent = "<<<<<<< HEAD"
    const { color, backgroundDark } = mergeSectionThemes[ConflictIdentity.CURRENT]
    head.style.color = color
    head.style.background = backgroundDark
  }

  private createMiddle = (clickHandler: ClickHandler, createUnconflictedFrom: (content?: Fragment, conflictInfo?: UnconflictedAttrs) => Node): HTMLDivElement => {
    const middle = this.createPartitioner()

    middle.title = "Accept Both"
    middle.textContent = "======="

    const bothTheme = mergeSectionThemes[ConflictIdentity.BOTH]
    middle.style.color = bothTheme.color
    middle.style.background = bothTheme.backgroundDark

    middle.addEventListener("click", () => {
      clickHandler((self, parent) => {
        const attrs = { originalConflict: parent, chosenIdentity: ConflictIdentity.BOTH }
        return createUnconflictedFrom(Fragment.fromArray([
          createUnconflictedFrom(parent.firstChild?.content),
          createUnconflictedFrom(self.content),
        ]), attrs)
      })
    })

    return middle
  }

  private formatTail = (tail: HTMLDivElement): void => {
    tail.textContent = `>>>>>>>`
    const { color, backgroundDark } = mergeSectionThemes[ConflictIdentity.INCOMING]
    tail.style.color = color
    tail.style.background = backgroundDark
  }

  private advanceToNextConflict = (): void => {
    const matches = /^#conflict([0-9])+$/g.exec(window.location.hash)
    if (matches) {
      window.location.hash = `#conflict${+matches[1] + 1}`
    }
  }

}

export default MergeSection