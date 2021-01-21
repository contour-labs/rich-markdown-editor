import { toggleMark } from "prosemirror-commands";
import markInputRule from "../lib/markInputRule";
import LocalMark, { MarkInformation } from "./LocalMark";
import { MarkSpec, MarkType, Node } from "prosemirror-model";
import { TokenConfig } from "prosemirror-markdown";
import { ExtensionOptions } from "../lib/Extension";
import { InputRule } from "prosemirror-inputrules";

function backticksFor(node: Node, side: number): string {
  const ticks = /`+/g;
  let match: RegExpMatchArray | null;
  let len = 0;

  if (node.isText) {
    while ((match = ticks.exec(node.text!))) {
      len = Math.max(len, match[0].length);
    }
  }

  let result = len > 0 && side > 0 ? " `" : "`";
  for (let i = 0; i < len; i++) {
    result += "`";
  }
  if (len > 0 && side < 0) {
    result += " ";
  }
  return result;
}

export default class Code extends LocalMark {

  get name(): string {
    return "code_inline";
  }

  get schema(): MarkSpec {
    return {
      excludes: "strong em link mark strikethrough",
      parseDOM: [{ tag: "code" }],
      toDOM: () => ["code", { spellCheck: "false" }],
    };
  }

  inputRules({ type }: ExtensionOptions): InputRule[] {
    return [markInputRule(/(?:^|[^`])(`([^`]+)`)$/, type as MarkType)];
  }

  keys({ type }: ExtensionOptions): Record<string, any> {
    // Note: This key binding only works on non-Mac platforms
    // https://github.com/ProseMirror/prosemirror/issues/515
    return {
      "Mod`": toggleMark(type as MarkType),
    };
  }

  get toMarkdown(): MarkInformation {
    return {
      open(_state, _mark, parent, index) {
        return backticksFor(parent.child(index), -1);
      },
      close(_state, _mark, parent, index) {
        return backticksFor(parent.child(index - 1), 1);
      },
      escape: false,
    };
  }

  parseMarkdown(): TokenConfig {
    return { mark: "code_inline" };
  }

}
