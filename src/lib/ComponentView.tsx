import * as React from "react";
import ReactDOM from "react-dom";
import { ThemeProvider } from "styled-components";
import { EditorView, Decoration, NodeView } from "prosemirror-view";
import { Node as ProsemirrorNode } from "prosemirror-model"
import Extension from "../lib/Extension";
import { light as lightTheme, dark as darkTheme } from "../theme";
import Editor from "../";

export interface ComponentOptions {
  node: ProsemirrorNode;
  theme: typeof lightTheme;
  isSelected: boolean;
  isEditable: boolean
  getPos: boolean | (() => number)
}

export interface ComponentViewOptions {
  editor: Editor,
  extension: Extension,
  node: ProsemirrorNode,
  view: EditorView,
  getPos: boolean | (() => number),
  decorations: Decoration[]
}

type ComponentConstructor = (options: ComponentOptions) => React.ReactElement;

export default class ComponentView implements NodeView {

  component: ComponentConstructor;
  editor: Editor;
  extension: Extension;
  node: ProsemirrorNode;
  view: EditorView;
  getPos: boolean | (() => number);
  decorations: Decoration<{ [key: string]: any }>[];
  isSelected = false;
  dom: Node;
  contentDOM: Node

  constructor(
    component: ComponentConstructor,
    { editor, extension, node, view, getPos, decorations }: ComponentViewOptions
  ) {
    this.component = component;
    this.editor = editor;
    this.extension = extension;
    this.getPos = getPos;
    this.decorations = decorations;
    this.node = node;
    this.view = view;

    const dom = document.createElement("div")
    dom.addEventListener("click", () => console.log("HEY! I'm a dom merge conflict :)"))
    dom.className = `component_view_dom ${node.type.name}`
    this.dom = dom

    const contentDOM = document.createElement("div")
    contentDOM.addEventListener("click", () => console.log("HEY! I'm a contentDOM merge conflict :)"))
    contentDOM.className = `component_view_contentDOM ${node.type.name}`
    // this.contentDOM = contentDOM
  }

}
