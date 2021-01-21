import { wrapIn, lift } from "prosemirror-commands";
import isNodeActive from "../queries/isNodeActive";
import { NodeType } from "prosemirror-model";
import { EditorState, Transaction } from "prosemirror-state";

export default function toggleWrap(type: NodeType) {
  return (state: EditorState, dispatch: (tr: Transaction) => void) => {
    const isActive = isNodeActive(type)(state);

    if (isActive) {
      return lift(state, dispatch);
    }

    return wrapIn(type)(state, dispatch);
  };
}
