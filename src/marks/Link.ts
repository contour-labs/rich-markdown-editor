import { toggleMark } from "prosemirror-commands";
import { Plugin, EditorState, Transaction } from "prosemirror-state";
import { InputRule } from "prosemirror-inputrules";
import LocalMark, { MarkInformation } from "./LocalMark";
import { MarkSpec, MarkType, Mark, Fragment } from "prosemirror-model";
import { ExtensionOptions, Command } from "../lib/Extension";
import { TokenConfig } from "prosemirror-markdown";

const LINK_INPUT_REGEX = /\[(.+)]\((\S+)\)/;

function isPlainURL(link: Mark, parent: Fragment, index: number, side: number): boolean {
  if (link.attrs.title || !/^\w+:/.test(link.attrs.href)) {
    return false;
  }

  const content = parent.child(index + (side < 0 ? -1 : 0));
  if (
    !content.isText ||
    content.text !== link.attrs.href ||
    content.marks[content.marks.length - 1] !== link
  ) {
    return false;
  }

  if (index === (side < 0 ? 1 : parent.childCount - 1)) {
    return true;
  }

  const next = parent.child(index + (side < 0 ? -2 : 1));
  return !link.isInSet(next.marks);
}

export default class Link extends LocalMark {

  get name(): string {
    return "link";
  }

  get schema(): MarkSpec {
    return {
      attrs: {
        href: {
          default: null,
        },
      },
      inclusive: false,
      parseDOM: [
        {
          tag: "a[href]",
          getAttrs: (dom: HTMLElement) => ({
            href: dom.getAttribute("href"),
          }),
        },
      ],
      toDOM: node => [
        "a",
        {
          ...node.attrs,
          rel: "noopener noreferrer nofollow",
        },
        0,
      ],
    };
  }

  inputRules({ type }: ExtensionOptions): InputRule[] {
    return [
      new InputRule(LINK_INPUT_REGEX, (state, match, start, end) => {
        const [okay, alt, href] = match;
        const { tr } = state;

        if (okay) {
          tr.replaceWith(start, end, this.editor.schema.text(alt)).addMark(
            start,
            start + alt.length,
            (type as MarkType).create({ href })
          );
        }

        return tr;
      }),
    ];
  }

  commands({ type }: ExtensionOptions): Record<string, Command> | Command {
    return ({ href } = { href: "" }) => toggleMark(type as MarkType, { href })
  }

  keys({ type }: ExtensionOptions): Record<string, any> {
    return {
      "Mod-k": (state: EditorState, dispatch: (tr: Transaction) => void) => {
        if (state.selection.empty) {
          this.options.onKeyboardShortcut();
          return true;
        }
        return toggleMark(type as MarkType, { href: "" })(state, dispatch);
      },
    };
  }

  get plugins(): Plugin[] {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            click: (view, event: MouseEvent) => {
              // allow opening links in editing mode with the meta/cmd key
              if (
                view.props.editable &&
                view.props.editable(view.state) &&
                !event.metaKey
              ) {
                return false;
              }

              if (event.target instanceof HTMLAnchorElement) {
                const { href } = event.target;

                const isHashtag = href.startsWith("#");
                if (isHashtag && this.options.onClickHashtag) {
                  event.stopPropagation();
                  event.preventDefault();
                  this.options.onClickHashtag(href);
                  return true;
                }

                if (this.options.onClickLink) {
                  event.stopPropagation();
                  event.preventDefault();
                  this.options.onClickLink(href);
                  return true;
                }
              }

              return false;
            },
          },
        },
      }),
    ];
  }

  get toMarkdown(): MarkInformation {
    return {
      open(_state, mark, parent, index) {
        return isPlainURL(mark, parent, index, 1) ? "<" : "[";
      },
      close(state, mark, parent, index) {
        return isPlainURL(mark, parent, index, -1)
          ? ">"
          : "](" +
          state.esc(mark.attrs.href) +
          (mark.attrs.title ? " " + state.quote(mark.attrs.title) : "") +
          ")";
      },
    };
  }

  parseMarkdown(): TokenConfig {
    return {
      mark: "link",
      getAttrs: tok => ({
        href: tok.attrGet("href"),
        title: tok.attrGet("title") || null,
      }),
    };
  }

}
