import * as React from "react"
import { NodeSpec, NodeType, Node } from "prosemirror-model";
import { ExtensionOptions, Command } from "../../../lib/Extension";
import { MarkdownSerializerState, TokenConfig } from "prosemirror-markdown";
import ReactNode from "./ReactNode";
import { ComponentOptions } from "../../../lib/ComponentView";

export default class Embed extends ReactNode {

  get name(): string {
    return "embed";
  }

  get schema(): NodeSpec {
    return {
      content: "inline*",
      group: "block",
      attrs: {
        href: {},
        component: {},
        matches: {},
      },
      parseDOM: [{ tag: "iframe" }],
      toDOM: node => [
        "iframe",
        { src: node.attrs.href, contentEditable: "false" },
        0,
      ],
    };
  }

  protected getComponent({ isEditable, isSelected, theme, node }: ComponentOptions): React.ReactElement {
    const Component = node.attrs.component;
    return (
      <div contentEditable={false}>
        <Component
          attrs={node.attrs}
          isEditable={isEditable}
          isSelected={isSelected}
          theme={theme}
        />
      </div>
    );
  }

  commands({ type }: ExtensionOptions): Record<string, Command> | Command {
    return attrs => (state, dispatch) => {
      dispatch(
        state.tr.replaceSelectionWith((type as NodeType).create(attrs)).scrollIntoView()
      );
      return true;
    };
  }

  toMarkdown(state: MarkdownSerializerState, node: Node): void {
    state.ensureNewLine();
    state.write(
      "[" + state.esc(node.attrs.href) + "](" + state.esc(node.attrs.href) + ")"
    );
    state.write("\n\n");
  }

  parseMarkdown(): TokenConfig {
    return {
      node: "embed",
      getAttrs: token => ({
        href: token.attrGet("href"),
        matches: token.attrGet("matches"),
        component: token.attrGet("component"),
      }),
    };
  }

}
