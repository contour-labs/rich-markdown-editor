import {
  splitListItem,
  sinkListItem,
  liftListItem,
} from "prosemirror-schema-list";
import LocalNode from "./LocalNode";
import { NodeSpec, NodeType, Node } from "prosemirror-model";
import { ExtensionOptions } from "../lib/Extension";
import { MarkdownSerializerState, TokenConfig } from "prosemirror-markdown";

export default class CheckboxItem extends LocalNode {

  get name(): string {
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

  handleChange = (event: MouseEvent) => {
    const { view } = this.editor;
    const { tr } = view.state;

    const result = view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    });

    if (result) {
      const transaction = tr.setNodeMarkup(result.inside, undefined, {
        checked: (event.target as HTMLInputElement).checked,
      });
      view.dispatch(transaction);
    }
  };

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
    state.write(node.attrs.checked ? "[x] " : "[ ] ");
    state.renderContent(node);
  }

  parseMarkdown(): TokenConfig {
    return {
      block: "checkbox_item",
      getAttrs: tok => ({
        checked: tok.attrGet("checked") ? true : undefined,
        id: tok.attrGet("id"),
      }),
    };
  }

}
