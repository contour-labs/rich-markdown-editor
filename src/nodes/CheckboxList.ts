import { wrappingInputRule, InputRule } from "prosemirror-inputrules";
import toggleList from "../commands/toggleList";
import LocalNode from "./LocalNode";
import { NodeSpec, NodeType, Node } from "prosemirror-model";
import { ExtensionOptions, Command } from "../lib/Extension";
import { MarkdownSerializerState, TokenConfig } from "prosemirror-markdown";

export default class CheckboxList extends LocalNode {

  get name(): string {
    return "checkbox_list";
  }

  get schema(): NodeSpec {
    return {
      group: "block",
      content: "checkbox_item+",
      toDOM: () => ["ul", { class: this.name }, 0],
      parseDOM: [
        {
          tag: `[class="${this.name}"]`,
        },
      ],
    };
  }

  keys({ type, schema }: ExtensionOptions): Record<string, any> {
    return {
      "Shift-Ctrl-7": toggleList(type as NodeType, schema.nodes.checkbox_item),
    };
  }

  commands({ type, schema }: ExtensionOptions): Record<string, Command> | Command {
    return () => toggleList(type as NodeType, schema.nodes.checkbox_item);
  }

  inputRules({ type }: ExtensionOptions): InputRule[] {
    return [wrappingInputRule(/^-?\s*(\[ \])\s$/i, type as NodeType)];
  }

  toMarkdown(state: MarkdownSerializerState, node: Node): void {
    state.renderList(node, "  ", () => "- ");
  }

  parseMarkdown(): TokenConfig {
    return { block: "checkbox_list" };
  }

}
