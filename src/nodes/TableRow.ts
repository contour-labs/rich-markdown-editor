import Node from './Node'
import { TokenConfig } from 'prosemirror-markdown'

export default class TableRow extends Node {
  get name() {
    return 'tr'
  }

  get schema() {
    return {
      content: '(th | td)*',
      tableRole: 'row',
      parseDOM: [{ tag: 'tr' }],
      toDOM() {
        return ['tr', 0]
      },
    }
  }

  parseMarkdown(): TokenConfig {
    return { block: 'tr' }
  }
}
