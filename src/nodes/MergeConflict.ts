import Node from './Node'
import { TokenConfig } from 'prosemirror-markdown'

export default class MergeConflict extends Node {

  parseMarkdown(): TokenConfig {
    throw new Error("Method not implemented.")
  }
  get schema(): any {
    return {
      group: 'block',
    }
  }
}
