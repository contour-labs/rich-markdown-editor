import { NodeSpec } from "prosemirror-model";
import NodeWithNodeView from "../NodeWithNodeView";
import { NodeViewConstructor } from "../../index"
import { NodeView } from "prosemirror-view";

export enum ConflictIdentity {
  CURRENT = "Current",
  INCOMING = "Incoming",
  BOTH = "Both"
}

export default class MergeConflict extends NodeWithNodeView {

  get name() {
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

}
