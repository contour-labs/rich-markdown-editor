import LocalNode from "./LocalNode";
import { NodeSpec, Node } from "prosemirror-model";
import { MarkdownSerializerState } from "prosemirror-markdown";

export default class Text extends LocalNode {

  get name(): string {
    return "text";
  }

  get schema(): NodeSpec {
    return {
      group: "inline",
    };
  }

  toMarkdown(state: MarkdownSerializerState, node: Node): void {
    state.text(node.text!);
  }

}
