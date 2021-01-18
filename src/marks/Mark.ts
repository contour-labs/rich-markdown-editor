/* eslint-disable @typescript-eslint/no-explicit-any */
import { toggleMark } from 'prosemirror-commands'
import Extension from '../lib/Extension'
import { Schema, MarkType } from 'prosemirror-model'
import { TokenConfig } from 'prosemirror-markdown'

export default abstract class Mark extends Extension {
  get type(): string {
    return 'mark'
  }

  abstract get schema(): Schema

  get markdownToken(): string {
    return ''
  }

  get toMarkdown(): Record<string, any> {
    return {}
  }

  abstract parseMarkdown(): TokenConfig

  commands({ type }: { type: MarkType }) {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    return () => toggleMark(type)
  }
}
