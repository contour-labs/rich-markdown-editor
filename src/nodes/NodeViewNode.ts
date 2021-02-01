import Node from './Node'
import RichMarkdownEditor from '../index'
import { NodeView, EditorView, Decoration } from 'prosemirror-view'
import { Node as ProsemirrorNode } from 'prosemirror-model'

export default abstract class NodeViewNode extends Node {
  getNodeViewConstructor(
    extensionProps: NodeViewExtensionProps
  ): NodeViewConstructor {
    return (
      node: ProsemirrorNode,
      view: EditorView,
      getPos: (() => number) | boolean,
      decorations: Decoration[]
    ) => {
      return this.getNodeView({
        node,
        view,
        getPos,
        decorations,
        ...extensionProps,
      })
    }
  }

  protected abstract getNodeView(props: NodeViewProps): NodeView
}

export type NodeViewConstructor = (
  node: ProsemirrorNode,
  view: EditorView,
  getPos: (() => number) | boolean,
  decorations: Decoration[]
) => NodeView

export interface NodeViewCoreProps {
  node: ProsemirrorNode
  view: EditorView
  getPos: (() => number) | boolean
  decorations: Decoration[]
}

export interface NodeViewExtensionProps {
  editor: RichMarkdownEditor
}

export type NodeViewProps = NodeViewCoreProps & NodeViewExtensionProps
