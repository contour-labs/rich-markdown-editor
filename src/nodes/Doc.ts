import LocalNode from "./LocalNode";
import { NodeSpec } from "prosemirror-model";

export default class Doc extends LocalNode {

  get name(): string {
    return "doc";
  }

  get schema(): NodeSpec {
    return {
      content: "block+",
      attrs: {
        conflictCount: {
          default: 0
        }
      }
    };
  }

}
