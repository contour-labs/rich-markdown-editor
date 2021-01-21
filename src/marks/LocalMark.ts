import { toggleMark } from "prosemirror-commands";
import Extension, { ExtensionOptions, Command } from "../lib/Extension";
import { MarkdownSerializerState, TokenConfig } from "prosemirror-markdown";
import { Fragment, MarkSpec, MarkType, Mark } from "prosemirror-model";

export interface MarkInformation {
  open: string | ((state: MarkdownSerializerState, mark: Mark, parent: Fragment, index: number) => string)
  close: string | ((state: MarkdownSerializerState, mark: Mark, parent: Fragment, index: number) => string)
  mixable?: boolean
  escape?: boolean
  expelEnclosingWhitespace?: boolean
}

export default abstract class LocalMark extends Extension {

  get type() {
    return "mark";
  }

  abstract get schema(): MarkSpec;

  get markdownToken(): string {
    return "";
  }

  get toMarkdown(): MarkInformation {
    throw new Error(`${this.name} must implement LocalMark.toMarkdown()`);
  }

  parseMarkdown(): TokenConfig | null {
    return null;
  }

  commands({ type }: ExtensionOptions): Record<string, Command> | Command {
    return () => toggleMark(type as MarkType);
  }

}
