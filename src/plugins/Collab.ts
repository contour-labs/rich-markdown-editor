import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { ySyncPlugin, yCursorPlugin, yUndoPlugin, undo, redo } from 'y-prosemirror'
import Extension from "../lib/Extension"

const ydoc = new Y.Doc()
const provider = new WebrtcProvider('prosemirror-debug', ydoc)
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