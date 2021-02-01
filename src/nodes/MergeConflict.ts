import { NodeSpec } from 'prosemirror-model'
import NodeViewNode, { NodeViewProps } from './NodeViewNode'
import { NodeView } from 'prosemirror-view'

export enum ConflictIdentity {
  CURRENT = 'Current',
  INCOMING = 'Incoming',
  BOTH = 'Both',
}

class MergeConflict extends NodeViewNode {
  get name(): string {
    return 'merge_conflict'
  }

  get schema(): NodeSpec {
    return {
      content: 'block*',
      group: 'block',
      selectable: false,
      attrs: {
        conflictId: {
          default: undefined,
        },
        commitHash: {
          default: undefined,
        },
      },
    }
  }

  getNodeView({ node }: NodeViewProps): NodeView {
    const dom = document.createElement('section')
    dom.style.display = 'flex'

    const locator = document.createElement('a')
    locator.id = `conflict${node.attrs.conflictId}`
    dom.appendChild(locator)

    const contentDOM = document.createElement('div')
    contentDOM.style.flex = '1'
    contentDOM.style.border = '1px solid #ebebeb'
    contentDOM.style.margin = '10px 0'

    dom.appendChild(contentDOM)

    return { dom, contentDOM }
  }

  toMarkdown(): void {
    throw new Error(
      'Should never allow the user to perform actions that serialize the state when there are unresolved merge conflicts in the UI'
    )
  }
}

export default MergeConflict
