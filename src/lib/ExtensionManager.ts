import { Schema, NodeSpec, MarkSpec, Node } from "prosemirror-model";
import { keymap } from "prosemirror-keymap";
import { MarkdownParser, MarkdownSerializerState } from "prosemirror-markdown";
import { MarkdownSerializer } from "./markdown/serializer";
import Editor from "../";
import Extension, { Command } from "./Extension";
import makeRules from "./markdown/rules";
import LocalNode from "../nodes/LocalNode";
import LocalMark, { MarkInformation } from "../marks/LocalMark";
import { InputRule } from "prosemirror-inputrules";
import { Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { EmbedDescriptor } from "../types";

interface SchemaProvider {
  schema: Schema
}

export default class ExtensionManager {
  extensions: Extension[];
  embeds: EmbedDescriptor[] | undefined;

  constructor(extensions: Extension[] = [], editor?: Editor) {
    if (editor) {
      extensions.forEach(extension => {
        extension.bindEditor(editor);
      });
    }

    this.extensions = extensions;
    this.embeds = editor ? editor.props.embeds : undefined;
  }

  get nodes(): Record<string, NodeSpec> {
    return this.extensions
      .filter(extension => extension.type === "node")
      .reduce(
        (nodes, node: LocalNode) => ({
          ...nodes,
          [node.name]: node.schema,
        }),
        {}
      );
  }

  get marks(): Record<string, MarkSpec> {
    return this.extensions
      .filter(extension => extension.type === "mark")
      .reduce(
        (marks, extension: Extension) => ({
          ...marks,
          [extension.name]: (extension as LocalMark).schema,
        }),
        {} as Record<string, MarkSpec>
      );
  }

  get plugins(): Plugin[] {
    return this.extensions
      .filter(extension => extension.plugins)
      .reduce((allPlugins, { plugins }) => [...allPlugins, ...plugins], []);
  }

  parser({ schema }): MarkdownParser {
    const tokens = this.extensions
      .filter(
        extension => extension.type === "mark" || extension.type === "node"
      )
      .reduce((nodes, extension: Extension) => {
        const resolved = extension as LocalNode | LocalMark
        const tokenConfig = resolved.parseMarkdown();

        if (tokenConfig) {
          nodes[resolved.markdownToken || resolved.name] = tokenConfig
        }

        return nodes
      }, {});

    return new MarkdownParser(
      schema,
      makeRules({ embeds: this.embeds }),
      tokens
    );
  }

  serializer(): MarkdownSerializer {
    const nodes = this.extensions
      .filter(extension => extension.type === "node")
      .reduce(
        (nodes, extension: Extension) => ({
          ...nodes,
          [extension.name]: (extension as LocalNode).toMarkdown,
        }),
        {} as Record<string, (state: MarkdownSerializerState, node: Node) => void>
      );

    const marks = this.extensions
      .filter(extension => extension.type === "mark")
      .reduce(
        (marks, extension: Extension) => ({
          ...marks,
          [extension.name]: (extension as LocalMark).toMarkdown,
        }),
        {} as Record<string, MarkInformation>
      );

    return new MarkdownSerializer(nodes, marks);
  }

  keymaps({ schema }: SchemaProvider): Plugin[] {
    const extensionKeymaps = this.extensions
      .filter(extension => ["extension"].includes(extension.type))
      .filter(extension => extension.keys)
      .map(extension => extension.keys({ schema }));

    const nodeMarkKeymaps = this.extensions
      .filter(extension => ["node", "mark"].includes(extension.type))
      .filter(extension => extension.keys)
      .map(extension =>
        extension.keys({
          type: schema[`${extension.type}s`][extension.name],
          schema,
        })
      );

    return [
      ...extensionKeymaps,
      ...nodeMarkKeymaps,
    ].map((keys: Record<string, any>) => keymap(keys));
  }

  inputRules({ schema }: { schema: Schema }): InputRule[] {
    const extensionInputRules = this.extensions
      .filter(extension => ["extension"].includes(extension.type))
      .filter(extension => extension.inputRules)
      .map(extension => extension.inputRules({ schema }));

    const nodeMarkInputRules = this.extensions
      .filter(extension => ["node", "mark"].includes(extension.type))
      .filter(extension => extension.inputRules)
      .map(extension =>
        extension.inputRules({
          type: schema[`${extension.type}s`][extension.name],
          schema,
        })
      );

    return [...extensionInputRules, ...nodeMarkInputRules].reduce(
      (allInputRules, inputRules) => [...allInputRules, ...inputRules],
      []
    );
  }

  commands({ schema, view }: SchemaProvider & { view: EditorView }): Record<string, any> {
    return this.extensions
      .filter(extension => extension.commands && ["node", "mark"].includes(extension.type))
      .reduce((allCommands, extension) => {
        const { name, type } = extension;
        const commands = {} as Record<string, any>;
        const value = extension.commands({
          schema,
          type: schema[`${type}s`][name]
        });

        const apply = (_command: Command, attrs: Record<string, any>) => {
          if (!view.editable) {
            return false;
          }
          view.focus();
          return _command(attrs)(view.state, view.dispatch, view);
        };

        const handle = (_name: string, _command: Command) => {
          if (Array.isArray(_command)) {
            commands[_name] = (attrs: Record<string, any>) => _command.forEach(callback => apply(callback, attrs));
          } else if (typeof _command === "function") {
            commands[_name] = (attrs: Record<string, any>) => apply(_command, attrs);
          }
        };

        if (typeof value === "object") {
          Object.entries(value).forEach(([commandName, commandValue]) => handle(commandName, commandValue));
        } else {
          handle(name, value);
        }

        return {
          ...allCommands,
          ...commands,
        } as Record<string, any>
      }, {} as Record<string, any>);
  }

}
