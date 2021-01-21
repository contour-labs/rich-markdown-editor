import * as React from "react";
import { Plugin, TextSelection } from "prosemirror-state";
import { InputRule } from "prosemirror-inputrules";
import styled from "styled-components";
import ImageZoom from "react-medium-image-zoom";
import getDataTransferFiles from "../lib/getDataTransferFiles";
import uploadPlaceholderPlugin from "../lib/uploadPlaceholder";
import insertFiles from "../commands/insertFiles";
import { NodeSpec, Node, NodeType } from "prosemirror-model";
import { MarkdownSerializerState, TokenConfig } from "prosemirror-markdown";
import { ExtensionOptions, Command } from "../lib/Extension";
import ReactNode from "./CustomRender/ReactNode";
import { ComponentOptions } from "../lib/ComponentView";

/**
 * Matches following attributes in Markdown-typed image: [, alt, src, title]
 *
 * Example:
 * ![Lorem](image.jpg) -> [, "Lorem", "image.jpg"]
 * ![](image.jpg "Ipsum") -> [, "", "image.jpg", "Ipsum"]
 * ![Lorem](image.jpg "Ipsum") -> [, "Lorem", "image.jpg", "Ipsum"]
 */
const IMAGE_INPUT_REGEX = /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/;

const uploadPlugin = (options: Record<string, any>) =>
  new Plugin({
    props: {
      handleDOMEvents: {
        paste(view, event: ClipboardEvent): boolean {
          if (view.props.editable && !view.props.editable(view.state)) {
            return false;
          }

          if (!event.clipboardData) return false;

          // check if we actually pasted any files
          const files = Array.from(event.clipboardData.items)
            .map(dt => dt.getAsFile())
            .filter(file => file);

          if (files.length === 0) return false;

          const { tr } = view.state;
          if (!tr.selection.empty) {
            tr.deleteSelection();
          }
          const pos = tr.selection.from;

          insertFiles(view, event, pos, files, options);
          return true;
        },
        drop(view, event: DragEvent): boolean {
          if (view.props.editable && !view.props.editable(view.state)) {
            return false;
          }

          // check if we actually dropped any files
          const files = getDataTransferFiles(event);
          if (files.length === 0) return false;

          // grab the position in the document for the cursor
          const result = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });

          if (result) {
            insertFiles(view, event, result.pos, files, options);
            return true;
          }

          return false;
        },
      },
    },
  });

export default class Image extends ReactNode {

  get name(): string {
    return "image";
  }

  get schema(): NodeSpec {
    return {
      inline: true,
      attrs: {
        src: {},
        alt: {
          default: null,
        },
      },
      content: "text*",
      marks: "",
      group: "inline",
      draggable: true,
      parseDOM: [
        {
          tag: "div[class=image]",
          getAttrs: (dom: HTMLElement) => {
            const img = dom.getElementsByTagName("img")[0];
            const caption = dom.getElementsByTagName("p")[0];

            return {
              src: img.getAttribute("src"),
              alt: caption.innerText,
            };
          },
        },
      ],
      toDOM: node => {
        return [
          "div",
          { class: "image" } as { [attr: string]: string },
          ["img", { ...node.attrs, contentEditable: "false" }],
          ["p", { class: "caption" }, 0],
        ];
      },
    };
  }

  handleKeyDown = (event: React.KeyboardEvent<HTMLParagraphElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      return;
    }
  };

  handleBlur = ({ node, getPos }) => (event: React.FocusEvent<HTMLParagraphElement>) => {
    const alt = event.target.innerText;
    const src = node.attrs.src;
    if (alt === node.attrs.alt) return;

    const { view } = this.editor;
    const { tr } = view.state;

    // update meta on object
    const pos = getPos();
    const transaction = tr.setNodeMarkup(pos, undefined, {
      src,
      alt,
    });
    view.dispatch(transaction);
  };

  component({ node, theme, isEditable, getPos }: ComponentOptions): React.ReactElement {
    const { alt, src } = node.attrs;

    return (
      <div className="image" contentEditable={false}>
        <ImageZoom
          image={{
            src,
            alt,
            style: {
              maxWidth: "100%",
              maxHeight: "75vh",
            },
          }}
          defaultStyles={{
            overlay: {
              backgroundColor: theme.background,
            },
          }}
          shouldRespectMaxDimension
        />
        {(isEditable || alt) && (
          <Caption
            onKeyDown={this.handleKeyDown}
            onBlur={this.handleBlur({ node, getPos })}
            tabIndex={-1}
            contentEditable={isEditable}
            suppressContentEditableWarning
          >
            {alt}
          </Caption>
        )}
      </div>
    );
  };

  toMarkdown(state: MarkdownSerializerState, node: Node): void {
    state.write(
      "![" +
      state.esc((node.attrs.alt || "").replace("\n", "") || "") +
      "](" +
      state.esc(node.attrs.src) +
      ")"
    );
  }

  parseMarkdown(): TokenConfig {
    return {
      node: "image",
      getAttrs: token => ({
        src: token.attrGet("src"),
        alt: token.children ? token.children[0].content : null,
      }),
    };
  }

  commands({ type }: ExtensionOptions): Record<string, Command> | Command {
    return attrs => (state, dispatch) => {
      const selection = state.selection as TextSelection;
      const position = selection.$cursor
        ? selection.$cursor.pos
        : selection.$to.pos;
      const node = (type as NodeType).create(attrs);
      const transaction = state.tr.insert(position, node);
      dispatch(transaction);
      return true;
    };
  }

  inputRules({ type }: ExtensionOptions): InputRule[] {
    return [
      new InputRule(IMAGE_INPUT_REGEX, (state, match, start, end) => {
        const [okay, alt, src] = match;
        const { tr } = state;

        if (okay) {
          tr.replaceWith(
            start - 1,
            end,
            (type as NodeType).create({
              src,
              alt,
            })
          );
        }

        return tr;
      }),
    ];
  }

  get plugins(): Plugin[] {
    return [uploadPlaceholderPlugin, uploadPlugin(this.options)];
  }

}

const Caption = styled.p`
  border: 0;
  display: block;
  font-size: 13px;
  font-style: italic;
  color: ${props => props.theme.textSecondary};
  padding: 2px 0;
  line-height: 16px;
  text-align: center;
  width: 100%;
  min-height: 1em;
  outline: none;
  background: none;
  resize: none;

  &:empty:before {
    color: ${props => props.theme.placeholder};
    content: "Write a caption";
    pointer-events: none;
  }
`;
