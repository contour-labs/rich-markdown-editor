import { wrappingInputRule, InputRule } from "prosemirror-inputrules";
import toggleList from "../commands/toggleList";
import LocalNode from "./LocalNode";
import { NodeSpec, Node, NodeType } from "prosemirror-model";
import { MarkdownSerializerState, TokenConfig } from "prosemirror-markdown";
import { ExtensionOptions, Command } from "../lib/Extension";

export default class OrderedList extends LocalNode {

  get name(): string {
    return "ordered_list";
  }

  get schema(): NodeSpec {
    return {
      attrs: {
        order: {
          default: 1,
        },
      },
      content: "list_item+",
      group: "block",
      parseDOM: [
        {
          tag: "ol",
          getAttrs: (dom: HTMLElement) => ({
            order: dom.hasAttribute("start")
              ? parseInt(dom.getAttribute("start") || "1", 10)
              : 1,
          }),
        },
      ],
      toDOM: node =>
        node.attrs.order === 1
          ? ["ol", 0]
          : ["ol", { start: node.attrs.order }, 0],
    };
  }

  commands({ type, schema }: ExtensionOptions): Record<string, Command> | Command {
    return () => toggleList(type as NodeType, schema.nodes.list_item);
  }

  keys({ type, schema }: ExtensionOptions): Record<string, any> {
    return {
      "Shift-Ctrl-9": toggleList(type as NodeType, schema.nodes.list_item),
    };
  }

  inputRules({ type }: ExtensionOptions): InputRule[] {
    return [
      wrappingInputRule(
        /^(\d+)\.\s$/,
        type as NodeType,
        match => ({ order: +match[1] }),
        (match, node) => node.childCount + node.attrs.order === +match[1]
      ),
    ];
  }

  toMarkdown(state: MarkdownSerializerState, node: Node): void {
    const start = node.attrs.order || 1;
    const maxW = `${start + node.childCount - 1}`.length;
    const space = state.repeat(" ", maxW + 2);

    state.renderList(node, space, i => {
      const nStr = `${start + i}`;
      return state.repeat(" ", maxW - nStr.length) + nStr + ". ";
    });
  }

  parseMarkdown(): TokenConfig {
    return { block: "ordered_list" };
  }

}
