import Node from "./Node";
import { NodeSpec } from "prosemirror-model";

export default class Unconflicted extends Node {
  get name() {
    return "unconflicted";
  }

  get schema(): NodeSpec {
    return {
      content: "inline*",
      group: "block",
      toDOM(node) {
        return [
          "div",
          0,
        ]
      }
    };
  }
}
