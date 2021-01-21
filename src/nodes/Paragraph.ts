import { setBlockType } from "prosemirror-commands";
import LocalNode from "./LocalNode";
import { NodeSpec, NodeType, Node } from "prosemirror-model";
import { TokenConfig, MarkdownSerializerState } from "prosemirror-markdown";
import { ExtensionOptions, Command } from "../lib/Extension";

export default class Paragraph extends LocalNode {

  get name(): string {
    return "paragraph";
  }

  get schema(): NodeSpec {
    return {
      content: "inline*",
      group: "block",
      parseDOM: [{ tag: "p" }],
      toDOM() {
        return ["p", 0];
      },
    };
  }

  keys({ type }: ExtensionOptions): Record<string, any> {
    return {
      "Shift-Ctrl-0": setBlockType(type as NodeType),
    };
  }

  commands({ type }: ExtensionOptions): Record<string, Command> | Command {
    return () => setBlockType(type as NodeType);
  }

  toMarkdown(state: MarkdownSerializerState, node: Node): void {
    // render empty paragraphs as hard breaks to ensure that newlines are
    // persisted between reloads (this breaks from markdown tradition)
    if (
      node.textContent.trim() === "" &&
      node.childCount === 0 &&
      !(state as any).inTable
    ) {
      state.write("\\\n");
    } else {
      state.renderInline(node);
      state.closeBlock(node);
    }
  }

  parseMarkdown(): TokenConfig {
    return { block: "paragraph" }
  }

}
