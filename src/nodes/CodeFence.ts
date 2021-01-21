import refractor from "refractor/core";
import bash from "refractor/lang/bash";
import css from "refractor/lang/css";
import clike from "refractor/lang/clike";
import csharp from "refractor/lang/csharp";
import java from "refractor/lang/java";
import javascript from "refractor/lang/javascript";
import json from "refractor/lang/json";
import markup from "refractor/lang/markup";
import php from "refractor/lang/php";
import python from "refractor/lang/python";
import powershell from "refractor/lang/powershell";
import ruby from "refractor/lang/ruby";
import typescript from "refractor/lang/typescript";

import { setBlockType } from "prosemirror-commands";
import { textblockTypeInputRule, InputRule } from "prosemirror-inputrules";
import copy from "copy-to-clipboard";
import Prism, { LANGUAGES } from "../plugins/Prism";
import LocalNode from "./LocalNode";
import { NodeSpec, NodeType, Node } from "prosemirror-model";
import { ExtensionOptions, Command } from "../lib/Extension";
import { Plugin } from "prosemirror-state";
import { MarkdownSerializerState, TokenConfig } from "prosemirror-markdown";

[
  bash,
  css,
  clike,
  csharp,
  java,
  javascript,
  json,
  markup,
  php,
  python,
  powershell,
  ruby,
  typescript,
].forEach(refractor.register);

export default class CodeFence extends LocalNode {

  get languageOptions(): [string, string][] {
    return Object.entries(LANGUAGES);
  }

  get name(): string {
    return "code_fence";
  }

  get schema(): NodeSpec {
    return {
      attrs: {
        language: {
          default: "javascript",
        },
      },
      content: "text*",
      marks: "",
      group: "block",
      code: true,
      defining: true,
      draggable: false,
      parseDOM: [{ tag: "pre", preserveWhitespace: "full" }],
      toDOM: node => {
        const button = document.createElement("button");
        button.innerText = "Copy";
        button.type = "button";
        button.addEventListener("click", this.handleCopyToClipboard(node));

        const select = document.createElement("select");
        select.addEventListener("change", this.handleLanguageChange);

        this.languageOptions.forEach(([key, label]) => {
          const option = document.createElement("option");
          const value = key === "none" ? "" : key;
          option.value = value;
          option.innerText = label;
          option.selected = node.attrs.language === value;
          select.appendChild(option);
        });

        return [
          "div",
          { class: "code-block" },
          ["div", { contentEditable: "false" }, select, button],
          ["pre", ["code", { spellCheck: "false" }, 0]],
        ];
      },
    };
  }

  commands({ type }: ExtensionOptions): Record<string, Command> | Command {
    return () => setBlockType(type as NodeType);
  }

  keys({ type }: ExtensionOptions): Record<string, any> {
    return {
      "Shift-Ctrl-\\": setBlockType(type as NodeType),
    };
  }

  handleCopyToClipboard(node: Node) {
    return () => {
      copy(node.textContent);
      if (this.options.onShowToast) {
        this.options.onShowToast("Copied to clipboard", "code_copied");
      }
    };
  }

  handleLanguageChange = (event: Event) => {
    const { view } = this.editor;
    const { tr } = view.state;
    const element = event.target as HTMLSelectElement;
    const { top, left } = element.getBoundingClientRect();
    const result = view.posAtCoords({ top, left });

    if (result) {
      const transaction = tr.setNodeMarkup(result.inside, undefined, {
        language: element.value,
      });
      view.dispatch(transaction);
    }
  };

  get plugins(): Plugin[] {
    return [
      Prism({
        name: this.name,
        deferred: !this.options.initialReadOnly,
      }),
    ];
  }

  inputRules({ type }: ExtensionOptions): InputRule[] {
    return [textblockTypeInputRule(/^```$/, type as NodeType)];
  }

  toMarkdown(state: MarkdownSerializerState, node: Node): void {
    state.write("```" + (node.attrs.language || "") + "\n");
    state.text(node.textContent, false);
    state.ensureNewLine();
    state.write("```");
    state.closeBlock(node);
  }

  get markdownToken(): string {
    return "fence";
  }

  parseMarkdown(): TokenConfig {
    return {
      block: "code_block",
      getAttrs: tok => ({ language: tok.info }),
    };
  }

}
