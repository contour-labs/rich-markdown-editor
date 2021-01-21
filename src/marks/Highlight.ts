import { toggleMark } from "prosemirror-commands";
import markInputRule from "../lib/markInputRule";
import LocalMark, { MarkInformation } from "./LocalMark";
import { MarkSpec, MarkType } from "prosemirror-model";
import { InputRule } from "prosemirror-inputrules";
import { ExtensionOptions } from "../lib/Extension";
import { TokenConfig } from "prosemirror-markdown";

export default class Highlight extends LocalMark {

  get name(): string {
    return "mark";
  }

  get schema(): MarkSpec {
    return {
      parseDOM: [{ tag: "mark" }],
      toDOM: () => ["mark"],
    };
  }

  inputRules({ type }: ExtensionOptions): InputRule[] {
    return [markInputRule(/(?:==)([^=]+)(?:==)$/, type as MarkType)];
  }

  keys({ type }: ExtensionOptions): Record<string, any> {
    return {
      "Mod-Ctrl-h": toggleMark(type as MarkType),
    };
  }

  get toMarkdown(): MarkInformation {
    return {
      open: "==",
      close: "==",
      mixable: true,
      expelEnclosingWhitespace: true,
    };
  }

  parseMarkdown(): TokenConfig {
    return { mark: "mark" };
  }

}
