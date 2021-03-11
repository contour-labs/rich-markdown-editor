import { redo, undo, yCursorPlugin, ySyncPlugin, yUndoPlugin } from 'y-prosemirror'
import { WebrtcProvider } from 'y-webrtc'
import * as Y from 'yjs'
import Extension from "../lib/Extension"

const ydoc = new Y.Doc()
const provider = new WebrtcProvider('prosemirror-debug23423423r', ydoc)
const type = ydoc.getXmlFragment('prosemirror')

export default class YSyncPlugin extends Extension {
  keys() {
    return {
      "Mod-z": undo,
      "Mod-y": redo,
      "Shift-Mod-z": redo
    };
  }

  get plugins() {
    return [ySyncPlugin(type), yCursorPlugin(provider.awareness), yUndoPlugin()]
  }
}