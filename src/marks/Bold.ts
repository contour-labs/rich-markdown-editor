import { toggleMark } from "prosemirror-commands";
import markInputRule from "../lib/markInputRule";
import LocalMark, { MarkInformation } from "./LocalMark";
import { MarkSpec, NodeType, MarkType } from "prosemirror-model";
import { TokenConfig } from "prosemirror-markdown";
import { ExtensionOptions } from "../lib/Extension";
import { InputRule } from "prosemirror-inputrules";

export default class Bold extends LocalMark {

  get name(): string {
    return "strong";
  }

  get schema(): MarkSpec {
    return {
      parseDOM: [
        { tag: "b" },
        { tag: "strong" },
        { style: "font-style", getAttrs: value => value === "bold" && null },
      ],
      toDOM: () => ["strong"],
    };
  }

  inputRules({ type }: ExtensionOptions): InputRule[] {
    return [markInputRule(/(?:\*\*|__)([^*_]+)(?:\*\*|__)$/, type as MarkType)];
  }

  keys({ type }: ExtensionOptions): Record<string, any> {
    return {
      "Mod-b": toggleMark(type as MarkType),
      "Mod-B": toggleMark(type as MarkType),
    };
  }

  get toMarkdown(): MarkInformation {
    return {
      open: "**",
      close: "**",
      mixable: true,
      expelEnclosingWhitespace: true,
    };
  }

  parseMarkdown(): TokenConfig {
    return { mark: "strong" };
  }

}
