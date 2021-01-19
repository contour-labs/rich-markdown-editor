import {
  splitListItem,
  sinkListItem,
  liftListItem,
} from "prosemirror-schema-list";
import Node from "./Node";
import { NodeSpec } from "prosemirror-model";

export default class CheckboxItem extends Node {
  get name() {
    return "checkbox_item";
  }

  get schema(): NodeSpec {
    return {
      attrs: {
        id: {
          default: "",
        },
        checked: {
          default: false,
        },
      },
      content: "paragraph block*",
      defining: true,
      draggable: false,
      parseDOM: [
        {
          tag: `li[data-type="${this.name}"]`,
          getAttrs: dom => ({
            checked: (dom as Document).getElementsByTagName("input")[0].checked
          })
          ,
        },
      ],
      toDOM: node => {
        const input = document.createElement("input");
        input.id = node.attrs.id;
        input.type = "checkbox";
        input.addEventListener("click", this.handleChange);

        if (node.attrs.checked) {
          input.checked = true;
        }

        const attrs: { [attr: string]: string } = {
          "data-type": this.name,
        }
        if (node.attrs.checked) {
          attrs.class = "checked"
        }
        return [
          "li",
          attrs,
          [
            "span",
            {
              contentEditable: "false",
            },
            input,
          ],
          ["div", 0],
        ];
      },
    };
  }

  handleChange = event => {
    const { view } = this.editor;
    const { tr } = view.state;

    const result = view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    });

    if (result) {
      const transaction = tr.setNodeMarkup(result.inside, undefined, {
        checked: event.target.checked,
      });
      view.dispatch(transaction);
    }
  };

  keys({ type }) {
    return {
      Enter: splitListItem(type),
      Tab: sinkListItem(type),
      "Shift-Tab": liftListItem(type),
      "Mod-]": sinkListItem(type),
      "Mod-[": liftListItem(type),
    };
  }

  toMarkdown(state, node) {
    state.write(node.attrs.checked ? "[x] " : "[ ] ");
    state.renderContent(node);
  }

  parseMarkdown() {
    return {
      block: "checkbox_item",
      getAttrs: tok => ({
        checked: tok.attrGet("checked") ? true : undefined,
        id: tok.attrGet("id"),
      }),
    };
  }
}
