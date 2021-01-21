import { InputRule } from "prosemirror-inputrules";
import LocalNode from "./LocalNode";
import { NodeSpec, NodeType, Node } from "prosemirror-model";
import { TokenConfig, MarkdownSerializerState } from "prosemirror-markdown";
import { ExtensionOptions, Command } from "../lib/Extension";
import { EditorState, Transaction } from "prosemirror-state";

export default class HorizontalRule extends LocalNode {

  get name(): string {
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

  commands({ type }: ExtensionOptions): Record<string, Command> | Command {
    return () => (state, dispatch) => {
      dispatch(state.tr.replaceSelectionWith((type as NodeType).create()).scrollIntoView());
      return true;
    };
  }

  keys({ type }: ExtensionOptions): Record<string, any> {
    return {
      "Mod-_": (state: EditorState, dispatch: (tr: Transaction) => void) => {
        dispatch(state.tr.replaceSelectionWith((type as NodeType).create()).scrollIntoView());
        return true;
      },
    };
  }

  inputRules({ type }: ExtensionOptions): InputRule[] {
    return [
      new InputRule(/^(?:---|___\s|\*\*\*\s)$/, (state, match, start, end) => {
        const { tr } = state;

        if (match[0]) {
          tr.replaceWith(start - 1, end, (type as NodeType).create({}));
        }

        return tr;
      }),
    ];
  }

  toMarkdown(state: MarkdownSerializerState, node: Node): void {
    state.write(node.attrs.markup || "\n---");
    state.closeBlock(node);
  }

  parseMarkdown(): TokenConfig {
    return { node: "hr" };
  }

}
