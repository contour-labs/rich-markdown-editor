import { MarkdownSerializerState, TokenConfig } from "prosemirror-markdown";
import { Node as ProsemirrorNode, NodeSpec } from "prosemirror-model";
import Extension from "../lib/Extension";

export default abstract class LocalNode extends Extension {

  get type(): string {
    return "node";
  }

  abstract get schema(): NodeSpec;

  get markdownToken(): string {
    return "";
  }

  toMarkdown(_state: MarkdownSerializerState, _node: ProsemirrorNode) {
    throw new Error(`${self.name} must implement LocalNode.toMarkdown()`);
  }

  parseMarkdown(): TokenConfig | null {
    return null;
  }

}
