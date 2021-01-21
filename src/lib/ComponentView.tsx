import * as React from "react";
import ReactDOM from "react-dom";
import { ThemeProvider } from "styled-components";
import { EditorView, Decoration, NodeView } from "prosemirror-view";
import Extension from "../lib/Extension";
import { light as lightTheme, dark as darkTheme } from "../theme";
import Editor from "../";
import { Node } from "prosemirror-model"
import ReactNode from "../nodes/CustomRender/ReactNode";

interface CommonOptions {
  node: Node
  getPos: boolean | (() => number)
}

export interface ComponentOptions extends CommonOptions {
  theme: typeof lightTheme
  isSelected: boolean
  isEditable: boolean
}

export interface ComponentViewOptions extends CommonOptions {
  extension: ReactNode
  editor: Editor
  view: EditorView
  decorations: Decoration[]
}

export type Component = (options: ComponentOptions) => React.ReactElement;

export default class ComponentView implements NodeView {
  component: Component;

  editor: Editor;
  extension: Extension;
  node: Node;
  view: EditorView;
  getPos: boolean | (() => number);
  decorations: Decoration<Record<string, any>>[];

  isSelected = false;
  dom: HTMLElement | null;

  // See https://prosemirror.net/docs/ref/#view.NodeView
  constructor(component: Component, { editor, extension, node, view, getPos, decorations }: ComponentViewOptions) {
    this.component = component;
    this.editor = editor;
    this.extension = extension;
    this.getPos = getPos;
    this.decorations = decorations;
    this.node = node;
    this.view = view;
    this.dom = node.type.spec.inline
      ? document.createElement("span")
      : document.createElement("div");

    this.renderElement();
  }

  renderElement() {
    const { dark } = this.editor.props;
    const theme = this.editor.props.theme || (dark ? darkTheme : lightTheme);

    const children = this.component({
      theme,
      node: this.node,
      isSelected: this.isSelected,
      isEditable: this.view.editable,
      getPos: this.getPos,
    });

    ReactDOM.render(
      <ThemeProvider theme={theme}>{children}</ThemeProvider>,
      this.dom
    );
  }

  update(node: Node): boolean {
    if (node.type !== this.node.type) {
      return false;
    }

    this.node = node;
    this.renderElement();
    return true;
  }

  selectNode(): void {
    if (this.view.editable) {
      this.isSelected = true;
      this.renderElement();
    }
  }

  deselectNode(): void {
    if (this.view.editable) {
      this.isSelected = false;
      this.renderElement();
    }
  }

  stopEvent(): boolean {
    return true;
  }

  destroy(): void {
    if (this.dom) {
      ReactDOM.unmountComponentAtNode(this.dom);
    }
    this.dom = null;
  }

  ignoreMutation(): boolean {
    return true;
  }

}