import { Plugin } from "prosemirror-state";
import copy from "copy-to-clipboard";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Node, NodeType, NodeSpec } from "prosemirror-model";
import { textblockTypeInputRule, InputRule } from "prosemirror-inputrules";
import { setBlockType } from "prosemirror-commands";
import { MarkdownSerializerState, TokenConfig } from "prosemirror-markdown";
import backspaceToParagraph from "../commands/backspaceToParagraph";
import toggleBlockType from "../commands/toggleBlockType";
import headingToSlug from "../lib/headingToSlug";
import LocalNode from "./LocalNode";
import { ExtensionOptions, Command } from "../lib/Extension";

export default class Heading extends LocalNode {

  get name(): string {
    return "heading";
  }

  get defaultOptions(): any {
    return {
      levels: [1, 2, 3, 4],
    };
  }

  get schema(): NodeSpec {
    return {
      attrs: {
        level: {
          default: 1,
        },
      },
      content: "inline*",
      group: "block",
      defining: true,
      draggable: false,
      parseDOM: this.options.levels.map(level => ({
        tag: `h${level}`,
        attrs: { level },
      })),
      toDOM: node => {
        const { level } = node.attrs

        const button = document.createElement("button");
        button.innerText = "#";
        button.type = "button";
        button.className = "heading-anchor";
        button.addEventListener("click", this.handleCopyLink());

        return [
          `h${level + (this.options.offset || 0)}`,
          button,
          ["span", 0],
        ];
      },
    };
  }

  toMarkdown(state: MarkdownSerializerState, node: Node): void {
    state.write(state.repeat("#", node.attrs.level) + " ");
    state.renderInline(node);
    state.closeBlock(node);
  }

  parseMarkdown(): TokenConfig {
    return {
      block: "heading",
      getAttrs(token): Record<string, any> {
        return { level: +token.tag.slice(1) }
      }
    }
  }

  commands({ type, schema }: ExtensionOptions): Record<string, Command> | Command {
    return attrs => toggleBlockType(type, schema.nodes.paragraph, attrs);
  }

  handleCopyLink = (): (event: Event) => void => {
    return event => {
      // this is unfortunate but appears to be the best way to grab the anchor
      // as it's added directly to the dom by a decoration.
      const hash = `#${(event.target as HTMLButtonElement)!.parentElement!.parentElement!.id}`;

      // the existing url might contain a hash already, lets make sure to remove
      // that rather than appending another one.
      const urlWithoutHash = window.location.href.split("#")[0];
      copy(urlWithoutHash + hash);

      if (this.options.onShowToast) {
        this.options.onShowToast("Link copied to clipboard", "heading_copied");
      }
    };
  };

  keys({ type }: ExtensionOptions): Record<string, any> {
    const options = this.options.levels.reduce(
      (items: Record<string, any>, level: number) => ({
        ...items,
        ...{
          [`Shift-Ctrl-${level}`]: setBlockType(type as NodeType, { level }),
        },
      }),
      {}
    );

    return {
      ...options,
      Backspace: backspaceToParagraph(type),
    };
  }

  get plugins(): Plugin[] {
    return [
      new Plugin({
        props: {
          decorations: state => {
            const { doc } = state;
            const decorations: Decoration[] = [];
            const previouslySeen = {};

            doc.descendants((node, pos) => {
              if (node.type.name !== this.name) return;

              // calculate the optimal id
              const slug = headingToSlug(node);
              let id = slug;

              // check if we've already used it, and if so how many times?
              // Make the new id based on that number ensuring that we have
              // unique ID's even when headings are identical
              if (previouslySeen[slug] > 0) {
                id = headingToSlug(node, previouslySeen[slug]);
              }

              // record that we've seen this slug for the next loop
              previouslySeen[slug] =
                previouslySeen[slug] !== undefined
                  ? previouslySeen[slug] + 1
                  : 1;

              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  id,
                  class: "heading-name",
                  nodeName: "a",
                })
              );
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  }

  inputRules({ type }: ExtensionOptions): InputRule[] {
    return this.options.levels.map((level: number) =>
      textblockTypeInputRule(new RegExp(`^(#{1,${level}})\\s$`), type as NodeType, () => ({
        level,
      }))
    );
  }

}
