import { InputRule } from "prosemirror-inputrules";
import Node from "./Node";
import { NodeSpec } from "prosemirror-model";
import { TokenConfig } from "prosemirror-markdown";

export default class HorizontalRule extends Node {
  get name() {
    return "hr";
  }

  get schema(): NodeSpec {
    return {
      group: "block",
      parseDOM: [{ tag: "hr" }],
      toDOM() {
        return ["div", ["hr"]];
      },
    };
  }

  commands({ type }) {
    return () => (state, dispatch) => {
      dispatch(state.tr.replaceSelectionWith(type.create()).scrollIntoView());
      return true;
    };
  }

  keys({ type }) {
    return {
      "Mod-_": (state, dispatch) => {
        dispatch(state.tr.replaceSelectionWith(type.create()).scrollIntoView());
        return true;
      },
    };
  }

  inputRules({ type }) {
    return [
      new InputRule(/^(?:---|___\s|\*\*\*\s)$/, (state, match, start, end) => {
        const { tr } = state;

        if (match[0]) {
          tr.replaceWith(start - 1, end, type.create({}));
        }

        return tr;
      }),
    ];
  }

  toMarkdown(state, node) {
    state.write(node.attrs.markup || "\n---");
    state.closeBlock(node);
  }

  parseMarkdown(): TokenConfig {
    return { node: "hr" };
  }
}
