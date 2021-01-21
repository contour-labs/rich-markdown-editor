import { NodeSpec, Node } from "prosemirror-model";
import NodeViewNode from "../CustomRender/NodeViewNode";
import { NodeViewConstructor } from "../../index"
import { NodeView } from "prosemirror-view";
import { MarkdownSerializerState } from "prosemirror-markdown";

export enum ConflictIdentity {
  CURRENT = "Current",
  INCOMING = "Incoming",
  BOTH = "Both"
}

class MergeConflict extends NodeViewNode {

  get name(): string {
    return "merge_conflict";
  }

  get schema(): NodeSpec {
    return {
      content: "block*",
      group: "block",
      selectable: false,
      attrs: {
        conflictId: {
          default: undefined
        },
        commitHash: {
          default: undefined
        }
      }
    }
  }

  get nodeViewConstructor(): NodeViewConstructor {
    return (node): NodeView => {
      const dom = document.createElement('section')
      dom.style.display = 'flex'

      const locator = document.createElement("a")
      locator.id = `conflict${node.attrs.conflictId}`
      dom.appendChild(locator)

      const contentDOM = document.createElement('div')
      contentDOM.style.flex = '1'
      contentDOM.style.border = "1px solid #ebebeb"
      contentDOM.style.margin = "10px 0";

      dom.appendChild(contentDOM)

      return { dom, contentDOM }
    }
  }

  toMarkdown(_state: MarkdownSerializerState, _node: Node): void {
    throw new Error("Should never allow the user to perform actions that serialize the state when there are unresolved merge conflicts in the UI")
  }

}

export default MergeConflict