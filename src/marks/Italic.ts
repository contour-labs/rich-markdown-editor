import { toggleMark } from "prosemirror-commands";
import markInputRule from "../lib/markInputRule";
import LocalMark, { MarkInformation } from "./LocalMark";
import { MarkSpec, MarkType } from "prosemirror-model";
import { InputRule } from "prosemirror-inputrules";
import { ExtensionOptions } from "../lib/Extension";
import { TokenConfig } from "prosemirror-markdown";

export default class Italic extends LocalMark {

  get name(): string {
    return "em";
  }

  get schema(): MarkSpec {
    return {
      parseDOM: [
        { tag: "i" },
        { tag: "em" },
        { style: "font-style", getAttrs: value => value === "italic" && null },
      ],
      toDOM: () => ["em"],
    };
  }

  inputRules({ type }: ExtensionOptions): InputRule[] {
    return [
      markInputRule(/(?:^|[^_])(_([^_]+)_)$/, type as MarkType),
      markInputRule(/(?:^|[^*])(\*([^*]+)\*)$/, type as MarkType),
    ];
  }

  keys({ type }: ExtensionOptions): Record<string, any> {
    return {
      "Mod-i": toggleMark(type as MarkType),
      "Mod-I": toggleMark(type as MarkType),
    };
  }

  get toMarkdown(): MarkInformation {
    return {
      open: "*",
      close: "*",
      mixable: true,
      expelEnclosingWhitespace: true,
    };
  }

  parseMarkdown(): TokenConfig {
    return { mark: "em" };
  }

}
