import { wrappingInputRule, InputRule } from "prosemirror-inputrules";
import toggleList from "../commands/toggleList";
import LocalNode from "./LocalNode";
import { NodeSpec, NodeType, Node } from "prosemirror-model";
import { ExtensionOptions, Command } from "../lib/Extension";
import { MarkdownSerializerState, TokenConfig } from "prosemirror-markdown";

export default class BulletList extends LocalNode {

  get name(): string {
    return "bullet_list";
  }

  get schema(): NodeSpec {
    return {
      content: "list_item+",
      group: "block",
      parseDOM: [{ tag: "ul" }],
      toDOM: () => ["ul", 0],
    };
  }

  commands({ type, schema }: ExtensionOptions): Record<string, Command> | Command {
    return () => toggleList(type as NodeType, schema.nodes.list_item);
  }

  keys({ type, schema }: ExtensionOptions): Record<string, any> {
    return {
      "Shift-Ctrl-8": toggleList(type as NodeType, schema.nodes.list_item),
    };
  }

  inputRules({ type }: ExtensionOptions): InputRule[] {
    return [wrappingInputRule(/^\s*([-+*])\s$/, type as NodeType)];
  }

  toMarkdown(state: MarkdownSerializerState, node: Node): void {
    state.renderList(node, "  ", () => (node.attrs.bullet || "*") + " ");
  }

  parseMarkdown(): TokenConfig {
    return { block: "bullet_list" };
  }

}
