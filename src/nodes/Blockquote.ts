import { wrappingInputRule, InputRule } from "prosemirror-inputrules";
import LocalNode from "./LocalNode";
import toggleWrap from "../commands/toggleWrap";
import { NodeSpec, NodeType, Node } from "prosemirror-model";
import { ExtensionOptions, Command } from "../lib/Extension";
import { MarkdownSerializerState, TokenConfig } from "prosemirror-markdown";

export default class Blockquote extends LocalNode {

  get name(): string {
    return "blockquote";
  }

  get schema(): NodeSpec {
    return {
      content: "block+",
      group: "block",
      parseDOM: [{ tag: "blockquote" }],
      toDOM: () => ["blockquote", 0],
    };
  }

  inputRules({ type }: ExtensionOptions): InputRule[] {
    return [wrappingInputRule(/^\s*>\s$/, type as NodeType)];
  }

  commands({ type }: ExtensionOptions): Record<string, Command> | Command {
    return () => toggleWrap(type as NodeType);
  }

  keys({ type }: ExtensionOptions): Record<string, any> {
    return {
      "Mod-]": toggleWrap(type as NodeType),
    };
  }

  toMarkdown(state: MarkdownSerializerState, node: Node): void {
    state.wrapBlock("> ", undefined, node, () => state.renderContent(node));
  }

  parseMarkdown(): TokenConfig {
    return { block: "blockquote" };
  }

}
