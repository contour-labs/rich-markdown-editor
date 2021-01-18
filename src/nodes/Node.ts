import { MarkdownSerializerState, TokenConfig } from 'prosemirror-markdown'
import { Node as ProsemirrorNode } from 'prosemirror-model'
import Extension from '../lib/Extension'

export default abstract class Node extends Extension {
  get type(): string {
    return 'node'
  }

  abstract get schema(): any

  get markdownToken(): string {
    return ''
  }

  abstract toMarkdown(
    state: MarkdownSerializerState,
    node: ProsemirrorNode
  ): void

  parseMarkdown(): TokenConfig | undefined {
    return undefined
  }
}
