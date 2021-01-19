import Node from "./Node";
import { NodeSpec } from "prosemirror-model";
import { conflictColors } from "../lib/markdown/mergeConflictPlugin";

export default class MergeSection extends Node {

  get name() {
    return "merge_section";
  }

  get schema(): NodeSpec {
    return {
      content: "inline*",
      group: "block",
      attrs: {
        identity: {
          default: undefined
        }
      },
      toDOM(node) {
        const { identity } = node.attrs
        return [
          "section",
          [
            "div",
            { style: `background: ${conflictColors.get(identity)}; pointer-events: none` },
            0
          ],
        ]
      }
    };
  }

}
