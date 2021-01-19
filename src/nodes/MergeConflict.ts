import { NodeSpec } from "prosemirror-model";
import NodeWithNodeView from "./NodeWithNodeView";
import { NodeViewConstructor } from "../index"
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
      content: "(inline | text)*",
      group: "block",
      attrs: {
        conflictId: {
          default: undefined
        }
      }
    }
  }

  get nodeViewConstructor(): NodeViewConstructor {
    return (): NodeView => {
      const dom = document.createElement('section')
      dom.style.display = 'flex'

      const contentDOM = document.createElement('div')
      contentDOM.style.flex = '1'

      dom.appendChild(contentDOM)

      return { dom, contentDOM }
    }
  }

}
