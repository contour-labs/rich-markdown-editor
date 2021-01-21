import { toggleMark } from "prosemirror-commands";
import markInputRule from "../lib/markInputRule";
import LocalMark, { MarkInformation } from "./LocalMark";
import { MarkSpec, MarkType } from "prosemirror-model";
import { ExtensionOptions } from "../lib/Extension";
import { InputRule } from "prosemirror-inputrules";
import { TokenConfig } from "prosemirror-markdown";

export default class Strikethrough extends LocalMark {

  get name(): string {
    return "strikethrough";
  }

  get schema(): MarkSpec {
    return {
      parseDOM: [
        {
          tag: "s",
        },
        {
          tag: "del",
        },
        {
          tag: "strike",
        },
      ],
      toDOM: () => ["del", 0],
    };
  }

  keys({ type }: ExtensionOptions): Record<string, any> {
    return {
      "Mod-d": toggleMark(type as MarkType),
    };
  }

  inputRules({ type }: ExtensionOptions): InputRule[] {
    return [markInputRule(/~([^~]+)~$/, type as MarkType)];
  }

  get toMarkdown(): MarkInformation {
    return {
      open: "~~",
      close: "~~",
      mixable: true,
      expelEnclosingWhitespace: true,
    };
  }

  get markdownToken(): string {
    return "s";
  }

  parseMarkdown(): TokenConfig {
    return { mark: "strikethrough" };
  }

}
