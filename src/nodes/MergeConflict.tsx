import { NodeSpec } from "prosemirror-model";
import ReactNode from "./ReactNode";
import React from "react"

import { ComponentOptions } from "../lib/ComponentView";

export default class MergeConflict extends ReactNode {

  get name() {
    return "merge_conflict";
  }

  component({ node, theme, isSelected, isEditable, getPos }: ComponentOptions): React.ReactElement {
    return <div>HEYO!!!</div>
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
