import { InputRule } from "prosemirror-inputrules";
import { Plugin, Transaction, EditorState } from "prosemirror-state";
import Editor from "../";
import { Schema, NodeType, MarkType } from "prosemirror-model";
import { EditorView } from "prosemirror-view";

export type Command = (attrs: Record<string, any>) => (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => any;

export interface ExtensionOptions {
  schema: Schema,
  type?: NodeType | MarkType
}

export default class Extension {
  options: Record<string, any>;
  editor: Editor;

  constructor(options: Record<string, any> = {}) {
    this.options = {
      ...this.defaultOptions,
      ...options,
    };
  }

  bindEditor(editor: Editor): void {
    this.editor = editor;
  }

  get type(): string {
    return "extension";
  }

  get name(): string {
    return "";
  }

  get plugins(): Plugin[] {
    return [];
  }

  keys(_options: ExtensionOptions): Record<string, any> {
    return {};
  }

  inputRules(_options: ExtensionOptions): InputRule[] {
    return [];
  }

  commands(_options: ExtensionOptions): Record<string, Command> | Command {
    return () => () => false;
  }

  get defaultOptions(): any {
    return {};
  }

}
