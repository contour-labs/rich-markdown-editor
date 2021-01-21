import {
  splitListItem,
  sinkListItem,
  liftListItem,
} from "prosemirror-schema-list";
import LocalNode from "./LocalNode";
import { NodeSpec, NodeType, Node } from "prosemirror-model";
import { ExtensionOptions } from "../lib/Extension";
import { MarkdownSerializerState, TokenConfig } from "prosemirror-markdown";

export default class ListItem extends LocalNode {

  get name(): string {
    return "list_item";
  }

  get schema(): NodeSpec {
    return {
      content: "paragraph block*",
      defining: true,
      draggable: false,
      parseDOM: [{ tag: "li" }],
      toDOM: () => ["li", 0],
    };
  }

  keys({ type }: ExtensionOptions): Record<string, any> {
    return {
      Enter: splitListItem(type as NodeType),
      Tab: sinkListItem(type as NodeType),
      "Shift-Tab": liftListItem(type as NodeType),
      "Mod-]": sinkListItem(type as NodeType),
      "Mod-[": liftListItem(type as NodeType),
    };
  }

  toMarkdown(state: MarkdownSerializerState, node: Node): void {
    state.renderContent(node);
  }

  parseMarkdown(): TokenConfig {
    return { block: "list_item" };
  }

}
