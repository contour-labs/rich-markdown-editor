import LocalNode from "../LocalNode"
import RichMarkdownEditor from "../.."
import { NodeView, EditorView, Decoration } from "prosemirror-view"
import { Node } from "prosemirror-model"

export default abstract class NodeViewNode extends LocalNode {

  getNodeViewConstructor(extensionProps: NodeViewExtensionProps): NodeViewConstructor {
    return (
      node: Node,
      view: EditorView,
      getPos: (() => number) | boolean,
      decorations: Decoration[]
    ) => {
      return this.getNodeView({ node, view, getPos, decorations, ...extensionProps })
    }
  }

  protected abstract getNodeView(props: NodeViewProps): NodeView;

}

export type NodeViewConstructor = (
  node: Node,
  view: EditorView,
  getPos: (() => number) | boolean,
  decorations: Decoration[]
) => NodeView

export interface NodeViewCoreProps {
  node: Node
  view: EditorView
  getPos: (() => number) | boolean
  decorations: Decoration[]
}

export interface NodeViewExtensionProps {
  editor: RichMarkdownEditor
}

export type NodeViewProps = NodeViewCoreProps & NodeViewExtensionProps