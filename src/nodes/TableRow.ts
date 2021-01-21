import LocalNode from "./LocalNode";
import { NodeSpec } from "prosemirror-model";
import { TokenConfig } from "prosemirror-markdown";

export default class TableRow extends LocalNode {

  get name(): string {
    return "tr";
  }

  get schema(): NodeSpec {
    return {
      content: "(th | td)*",
      tableRole: "row",
      parseDOM: [{ tag: "tr" }],
      toDOM() {
        return ["tr", 0];
      },
    };
  }

  parseMarkdown(): TokenConfig {
    return { block: "tr" };
  }

}
