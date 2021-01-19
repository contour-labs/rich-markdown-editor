/* global window File Promise */
import * as React from "react";
import { EditorState, Selection, Plugin } from "prosemirror-state";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { MarkdownParser, MarkdownSerializer } from "prosemirror-markdown";
import { EditorView, Decoration, NodeView } from "prosemirror-view";
import { Schema, NodeSpec, MarkSpec, Node as ProsemirrorNode, Slice, Fragment } from "prosemirror-model";
import { inputRules, InputRule } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { selectColumn, selectRow, selectTable } from "prosemirror-utils";
import styled, { ThemeProvider } from "styled-components";
import { light as lightTheme, dark as darkTheme } from "./theme";
import Flex from "./components/Flex";
import { SearchResult } from "./components/LinkEditor";
import { EmbedDescriptor } from "./types";
import SelectionToolbar from "./components/SelectionToolbar";
import BlockMenu from "./components/BlockMenu";
import LinkToolbar from "./components/LinkToolbar";
import Tooltip from "./components/Tooltip";
import Extension from "./lib/Extension";
import ExtensionManager from "./lib/ExtensionManager";
import headingToSlug from "./lib/headingToSlug";

// nodes
import NodeWithNodeView from "./nodes/NodeWithNodeView";
import Doc from "./nodes/Doc";
import Text from "./nodes/Text";
import Blockquote from "./nodes/Blockquote";
import BulletList from "./nodes/BulletList";
import CodeBlock from "./nodes/CodeBlock";
import CodeFence from "./nodes/CodeFence";
import CheckboxList from "./nodes/CheckboxList";
import CheckboxItem from "./nodes/CheckboxItem";
import Embed from "./nodes/Embed";
import Heading from "./nodes/Heading";
import HorizontalRule from "./nodes/HorizontalRule";
import Image from "./nodes/Image";
import ListItem from "./nodes/ListItem";
import OrderedList from "./nodes/OrderedList";
import Paragraph from "./nodes/Paragraph";
import Table from "./nodes/Table";
import TableCell from "./nodes/TableCell";
import TableHeadCell from "./nodes/TableHeadCell";
import TableRow from "./nodes/TableRow";

// marks
import Bold from "./marks/Bold";
import Code from "./marks/Code";
import Highlight from "./marks/Highlight";
import Italic from "./marks/Italic";
import Link from "./marks/Link";
import Strikethrough from "./marks/Strikethrough";

// plugins
import BlockMenuTrigger from "./plugins/BlockMenuTrigger";
import History from "./plugins/History";
import Keys from "./plugins/Keys";
import Placeholder from "./plugins/Placeholder";
import SmartText from "./plugins/SmartText";
import TrailingNode from "./plugins/TrailingNode";
import MarkdownPaste from "./plugins/MarkdownPaste";
import { parseConflicts } from "./lib/merge_core";
import MergeConflict, { ConflictIdentity } from "./nodes/MergeConflict";
import MergeSection from "./nodes/MergeSection";
import Unconflicted from "./nodes/Unconflicted";

export { schema, parser, serializer } from "./server";

export { default as Extension } from "./lib/Extension";

export const theme = lightTheme;

export type Props = {
  id?: string;
  value?: string;
  defaultValue: string;
  placeholder: string;
  extensions: Extension[];
  autoFocus?: boolean;
  readOnly?: boolean;
  dark?: boolean;
  theme?: typeof theme;
  headingsOffset?: number;
  uploadImage?: (file: File) => Promise<string>;
  onSave?: ({ done: boolean }) => void;
  onCancel?: () => void;
  onChange: (value: () => string) => void;
  onImageUploadStart?: () => void;
  onImageUploadStop?: () => void;
  onCreateLink?: (title: string) => Promise<string>;
  onSearchLink?: (term: string) => Promise<SearchResult[]>;
  onClickLink: (href: string) => void;
  onClickHashtag?: (tag: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  embeds: EmbedDescriptor[];
  onShowToast?: (message: string) => void;
  tooltip: typeof React.Component;
  className?: string;
  style?: Record<string, string>;
};

type State = {
  blockMenuOpen: boolean;
  linkMenuOpen: boolean;
  blockMenuSearch: string;
};

export type NodeViewConstructor = (
  node: ProsemirrorNode,
  view: EditorView,
  getPos: (() => number) | boolean,
  decorations: Decoration[]
) => NodeView

class RichMarkdownEditor extends React.PureComponent<Props, State> {
  static defaultProps = {
    defaultValue: "",
    placeholder: "Write something nice…",
    onImageUploadStart: () => {
      // no default behavior
    },
    onImageUploadStop: () => {
      // no default behavior
    },
    onClickLink: href => {
      window.open(href, "_blank");
    },
    embeds: [],
    extensions: [],
    tooltip: Tooltip,
  };

  state = {
    blockMenuOpen: false,
    linkMenuOpen: false,
    blockMenuSearch: "",
  };

  extensions: ExtensionManager;
  element?: HTMLElement | null;
  view: EditorView;
  schema: Schema;
  serializer: MarkdownSerializer;
  parser: MarkdownParser;
  plugins: Plugin[];
  keymaps: Plugin[];
  inputRules: InputRule[];
  nodeViews: { [name: string]: NodeViewConstructor };
  nodes: { [name: string]: NodeSpec };
  marks: { [name: string]: MarkSpec };
  commands: Record<string, any>;

  componentDidMount() {
    this.init();
    this.scrollToAnchor();

    if (this.props.readOnly) return;

    if (this.props.autoFocus) {
      this.focusAtEnd();
    }
  }

  componentDidUpdate(prevProps: Props) {
    // Allow changes to the 'value' prop to update the editor from outside
    if (this.props.value && prevProps.value !== this.props.value) {
      const newState = this.createState(this.props.value);
      this.view.updateState(newState);
    }

    // pass readOnly changes through to underlying editor instance
    if (prevProps.readOnly !== this.props.readOnly) {
      this.view.update({
        ...this.view.props,
        editable: () => !this.props.readOnly,
      });
    }

    // Focus at the end of the document if switching from readOnly and autoFocus
    // is set to true
    if (prevProps.readOnly && !this.props.readOnly && this.props.autoFocus) {
      this.focusAtEnd();
    }
  }

  init() {
    this.extensions = this.createExtensions();
    this.nodes = this.createNodes();
    this.marks = this.createMarks();
    this.schema = this.createSchema();
    this.plugins = this.createPlugins();
    this.keymaps = this.createKeymaps();
    this.serializer = this.createSerializer();
    this.parser = this.createParser();
    this.inputRules = this.createInputRules();
    this.nodeViews = this.createNodeViews();
    this.view = this.createView();
    this.commands = this.createCommands();
  }

  createExtensions() {
    // adding nodes here? Update schema.ts for serialization on the server
    return new ExtensionManager(
      [
        new Doc(),
        new Text(),
        new Paragraph(),
        new Blockquote(),
        new BulletList(),
        new CodeBlock({
          initialReadOnly: this.props.readOnly,
          onShowToast: this.props.onShowToast,
        }),
        new CodeFence({
          initialReadOnly: this.props.readOnly,
          onShowToast: this.props.onShowToast,
        }),
        new CheckboxList(),
        new CheckboxItem(),
        new Embed(),
        new ListItem(),
        new Heading({
          onShowToast: this.props.onShowToast,
          offset: this.props.headingsOffset,
        }),
        new HorizontalRule(),
        new Image({
          uploadImage: this.props.uploadImage,
          onImageUploadStart: this.props.onImageUploadStart,
          onImageUploadStop: this.props.onImageUploadStop,
          onShowToast: this.props.onShowToast,
        }),
        new Table(),
        new TableCell({
          onSelectTable: this.handleSelectTable,
          onSelectRow: this.handleSelectRow,
        }),
        new TableHeadCell({
          onSelectColumn: this.handleSelectColumn,
        }),
        new TableRow(),
        new Bold(),
        new Code(),
        new Highlight(),
        new Italic(),
        new Link({
          onKeyboardShortcut: this.handleOpenLinkMenu,
          onClickLink: this.props.onClickLink,
          onClickHashtag: this.props.onClickHashtag,
        }),
        new Strikethrough(),
        new OrderedList(),
        new History(),
        new SmartText(),
        new TrailingNode(),
        new MarkdownPaste(),
        new Keys({
          onSave: this.handleSave,
          onSaveAndExit: this.handleSaveAndExit,
          onCancel: this.props.onCancel,
        }),
        new BlockMenuTrigger({
          onOpen: this.handleOpenBlockMenu,
          onClose: this.handleCloseBlockMenu,
        }),
        new Placeholder({
          placeholder: this.props.placeholder,
        }),
        new MergeConflict(),
        new MergeSection(),
        new Unconflicted(),
        ...this.props.extensions,
      ] as Extension[],
      this
    );
  }

  createPlugins() {
    return this.extensions.plugins;
  }

  createKeymaps() {
    return this.extensions.keymaps({
      schema: this.schema,
    });
  }

  createInputRules() {
    return this.extensions.inputRules({
      schema: this.schema,
    });
  }

  createNodeViews(): { [name: string]: NodeViewConstructor } {
    return this.extensions.extensions
      .reduce((nodeViewConstructors, extension) => {
        if (extension instanceof NodeWithNodeView) {
          nodeViewConstructors[extension.name] = extension.nodeViewConstructor
        }
        return nodeViewConstructors
      }, {} as { [name: string]: NodeViewConstructor });
  }

  createCommands() {
    return this.extensions.commands({
      schema: this.schema,
      view: this.view,
    });
  }

  createNodes() {
    return this.extensions.nodes;
  }

  createMarks() {
    return this.extensions.marks;
  }

  createSchema() {
    return new Schema({
      nodes: this.nodes,
      marks: this.marks,
    });
  }

  createSerializer() {
    return this.extensions.serializer();
  }

  createParser() {
    return this.extensions.parser({
      schema: this.schema,
    });
  }

  createState(value?: string) {
    return EditorState.create({
      schema: this.schema,
      doc: this.createDocument(value || this.props.defaultValue),
      plugins: [
        ...this.plugins,
        ...this.keymaps,
        dropCursor(),
        gapCursor(),
        inputRules({
          rules: this.inputRules,
        }),
        keymap(baseKeymap),
      ],
    });
  }

  createDocument(content: string) {
    const conflicts = parseConflicts(content)
    if (conflicts === false) {
      return this.parser.parse(content)
    }
    let conflictId = 0
    return this.schema.nodes.doc.create(
      {},
      Fragment.fromArray(conflicts.map(portion => {
        if (typeof portion === "string") {
          return this.schema.nodes.unconflicted.create(
            {},
            this.parser.parse(portion).content
          )
        } else {
          const mineContent = this.parser.parse(portion.mine).content
          const theirsContent = this.parser.parse(portion.theirs).content
          console.log("Mine", mineContent)
          console.log("Theirs", theirsContent)
          const mergeConflict = this.schema.nodes.merge_conflict.create(
            { conflictId },
            Fragment.fromArray([
              this.schema.nodes.merge_section.create(
                {
                  identity: ConflictIdentity.CURRENT,
                  conflictId
                },
                mineContent
              ),
              this.schema.nodes.merge_section.create(
                {
                  identity: ConflictIdentity.INCOMING,
                  conflictId
                },
                theirsContent
              )
            ])
          )
          conflictId += 1
          return mergeConflict
        }
      }))
    )
  }

  createView() {
    if (!this.element) {
      throw new Error("createView called before ref available");
    }

    const view = new EditorView(this.element, {
      state: this.createState(),
      editable: () => !this.props.readOnly,
      nodeViews: this.nodeViews,
      dispatchTransaction: transaction => {
        const { state, transactions } = this.view.state.applyTransaction(
          transaction
        );

        this.view.updateState(state);

        // If any of the transactions being dispatched resulted in the doc
        // changing then call our own change handler to let the outside world
        // know
        if (transactions.some(tr => tr.docChanged)) {
          this.handleChange();
        }

        // Because Prosemirror and React are not linked we must tell React that
        // a render is needed whenever the Prosemirror state changes.
        this.forceUpdate();
      },
    });

    return view;
  }

  scrollToAnchor() {
    const { hash } = window.location;
    if (!hash) return;

    try {
      const element = document.querySelector(hash);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      // querySelector will throw an error if the hash begins with a number
      // or contains a period. This is protected against now by safeSlugify
      // however previous links may be in the wild.
      console.warn(`Attempted to scroll to invalid hash: ${hash}`, err);
    }
  }

  value = (): string => {
    return this.serializer.serialize(this.view.state.doc);
  };

  handleChange = () => {
    if (this.props.onChange && !this.props.readOnly) {
      this.props.onChange(() => {
        return this.value();
      });
    }
  };

  handleSave = () => {
    const { onSave } = this.props;
    if (onSave) {
      onSave({ done: false });
    }
  };

  handleSaveAndExit = () => {
    const { onSave } = this.props;
    if (onSave) {
      onSave({ done: true });
    }
  };

  handleOpenLinkMenu = () => {
    this.setState({ linkMenuOpen: true });
  };

  handleCloseLinkMenu = () => {
    this.setState({ linkMenuOpen: false });
  };

  handleOpenBlockMenu = (search: string) => {
    this.setState({ blockMenuOpen: true, blockMenuSearch: search });
  };

  handleCloseBlockMenu = () => {
    if (!this.state.blockMenuOpen) return;
    this.setState({ blockMenuOpen: false });
  };

  handleSelectRow = (index: number, state: EditorState) => {
    this.view.dispatch(selectRow(index)(state.tr));
  };

  handleSelectColumn = (index: number, state: EditorState) => {
    this.view.dispatch(selectColumn(index)(state.tr));
  };

  handleSelectTable = (state: EditorState) => {
    this.view.dispatch(selectTable(state.tr));
  };

  // 'public' methods
  focusAtStart = () => {
    const selection = Selection.atStart(this.view.state.doc);
    const transaction = this.view.state.tr.setSelection(selection);
    this.view.dispatch(transaction);
    this.view.focus();
  };

  focusAtEnd = () => {
    const selection = Selection.atEnd(this.view.state.doc);
    const transaction = this.view.state.tr.setSelection(selection);
    this.view.dispatch(transaction);
    this.view.focus();
  };

  getHeadings = () => {
    const headings: { title: string; level: number; id: string }[] = [];
    const previouslySeen = {};

    this.view.state.doc.forEach(node => {
      if (node.type.name === "heading") {
        // calculate the optimal slug
        const slug = headingToSlug(node);
        let id = slug;

        // check if we've already used it, and if so how many times?
        // Make the new id based on that number ensuring that we have
        // unique ID's even when headings are identical
        if (previouslySeen[slug] > 0) {
          id = headingToSlug(node, previouslySeen[slug]);
        }

        // record that we've seen this slug for the next loop
        previouslySeen[slug] =
          previouslySeen[slug] !== undefined ? previouslySeen[slug] + 1 : 1;

        headings.push({
          title: node.textContent,
          level: node.attrs.level,
          id,
        });
      }
    });
    return headings;
  };

  render = () => {
    const { dark, readOnly, style, tooltip, className, onKeyDown } = this.props;
    const theme = this.props.theme || (dark ? darkTheme : lightTheme);

    return (
      <Flex
        onKeyDown={onKeyDown}
        style={style}
        className={className}
        align="flex-start"
        justify="center"
        column
      >
        <ThemeProvider theme={theme}>
          <React.Fragment>
            <StyledEditor
              readOnly={readOnly}
              ref={ref => (this.element = ref)}
            />
            {!readOnly && this.view && (
              <React.Fragment>
                <SelectionToolbar
                  view={this.view}
                  commands={this.commands}
                  onSearchLink={this.props.onSearchLink}
                  onClickLink={this.props.onClickLink}
                  onCreateLink={this.props.onCreateLink}
                  tooltip={tooltip}
                />
                <LinkToolbar
                  view={this.view}
                  isActive={this.state.linkMenuOpen}
                  onCreateLink={this.props.onCreateLink}
                  onSearchLink={this.props.onSearchLink}
                  onClickLink={this.props.onClickLink}
                  onShowToast={this.props.onShowToast}
                  onClose={this.handleCloseLinkMenu}
                  tooltip={tooltip}
                />
                <BlockMenu
                  view={this.view}
                  commands={this.commands}
                  isActive={this.state.blockMenuOpen}
                  search={this.state.blockMenuSearch}
                  onClose={this.handleCloseBlockMenu}
                  uploadImage={this.props.uploadImage}
                  onImageUploadStart={this.props.onImageUploadStart}
                  onImageUploadStop={this.props.onImageUploadStop}
                  onShowToast={this.props.onShowToast}
                  embeds={this.props.embeds}
                />
              </React.Fragment>
            )}
          </React.Fragment>
        </ThemeProvider>
      </Flex>
    );
  };
}

const StyledEditor = styled("div") <{ readOnly?: boolean }>`
  color: ${props => props.theme.text};
  background: ${props => props.theme.background};
  font-family: ${props => props.theme.fontFamily};
  font-weight: ${props => props.theme.fontWeight};
  font-size: 1em;
  line-height: 1.7em;
  width: 100%;

  .ProseMirror {
    position: relative;
    outline: none;
    word-wrap: break-word;
    white-space: pre-wrap;
    white-space: break-spaces;
    -webkit-font-variant-ligatures: none;
    font-variant-ligatures: none;
    font-feature-settings: "liga" 0; /* the above doesn't seem to work in Edge */
  }

  pre {
    white-space: pre-wrap;
  }

  li {
    position: relative;
  }

  img {
    max-width: 100%;
  }

  .image {
    text-align: center;

    img {
      pointer-events: ${props => (props.readOnly ? "initial" : "none")};
    }
  }

  .image.placeholder img {
    opacity: 0.5;
  }

  .ProseMirror-hideselection *::selection {
    background: transparent;
  }
  .ProseMirror-hideselection *::-moz-selection {
    background: transparent;
  }
  .ProseMirror-hideselection {
    caret-color: transparent;
  }

  .ProseMirror-selectednode {
    outline: 2px solid ${props => props.theme.selected};
  }

  /* Make sure li selections wrap around markers */

  li.ProseMirror-selectednode {
    outline: none;
  }

  li.ProseMirror-selectednode:after {
    content: "";
    position: absolute;
    left: -32px;
    right: -2px;
    top: -2px;
    bottom: -2px;
    border: 2px solid ${props => props.theme.selected};
    pointer-events: none;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 1em 0 0.5em;
    font-weight: 500;
    cursor: default;

    &:not(.placeholder):before {
      display: ${props => (props.readOnly ? "none" : "block")};
      position: absolute;
      font-family: ${props => props.theme.fontFamilyMono};
      color: ${props => props.theme.textSecondary};
      font-size: 13px;
      left: -24px;
    }
  }

  a:first-child {
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-top: 0;
    }
  }

  h1:not(.placeholder):before {
    content: "H1";
    line-height: 3em;
  }
  h2:not(.placeholder):before {
    content: "H2";
    line-height: 2.8em;
  }
  h3:not(.placeholder):before {
    content: "H3";
    line-height: 2.3em;
  }
  h4:not(.placeholder):before {
    content: "H4";
    line-height: 2.2em;
  }
  h5:not(.placeholder):before {
    content: "H5";
  }
  h6:not(.placeholder):before {
    content: "H6";
  }

  .heading-name {
    color: ${props => props.theme.text};

    &:hover {
      text-decoration: none;

      .heading-anchor {
        opacity: 1;
      }
    }
  }

  .with-emoji {
    margin-left: -1em;
  }

  .heading-anchor {
    opacity: 0;
    display: ${props => (props.readOnly ? "block" : "none")};
    color: ${props => props.theme.textSecondary};
    cursor: pointer;
    background: none;
    border: 0;
    outline: none;
    padding: 2px 12px 2px 4px;
    margin: 0;
    position: absolute;
    transition: opacity 100ms ease-in-out;
    font-family: ${props => props.theme.fontFamilyMono};
    font-size: 22px;
    left: -1.3em;

    &:focus,
    &:hover {
      color: ${props => props.theme.text};
    }
  }

  .placeholder {
    &:before {
      display: block;
      content: ${props => (props.readOnly ? "" : "attr(data-empty-text)")};
      pointer-events: none;
      height: 0;
      color: ${props => props.theme.placeholder};
    }
  }

  blockquote {
    border-left: 3px solid ${props => props.theme.quote};
    margin: 0;
    padding-left: 10px;
    font-style: italic;
  }

  b,
  strong {
    font-weight: 600;
  }

  p {
    position: relative;
    margin: 0;
  }

  a {
    color: ${props => props.theme.link};
  }

  a:hover {
    text-decoration: ${props => (props.readOnly ? "underline" : "none")};
  }

  ul,
  ol {
    margin: 0 0.1em;
    padding: 0 0 0 1em;

    ul,
    ol {
      margin: 0;
    }
  }

  ul.checkbox_list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  ul.checkbox_list li {
    display: flex;
  }

  ul.checkbox_list li.checked > div > p {
    color: ${props => props.theme.textSecondary};
    text-decoration: line-through;
  }

  ul.checkbox_list li input {
    pointer-events: ${props => (props.readOnly ? "none" : "initial")};
    opacity: ${props => (props.readOnly ? 0.75 : 1)};
    margin: 0 0.5em 0 0;
    width: 14px;
    height: 14px;
  }

  li p:first-child {
    margin: 0;
  }

  hr {
    height: 0;
    border: 0;
    border-top: 1px solid ${props => props.theme.horizontalRule};
  }

  code {
    border-radius: 4px;
    border: 1px solid ${props => props.theme.codeBorder};
    padding: 3px 4px;
    font-family: ${props => props.theme.fontFamilyMono};
    font-size: 85%;
  }

  mark {
    border-radius: 1px;
    color: ${props => props.theme.black};
    background: ${props => props.theme.textHighlight};
  }

  .code-block {
    position: relative;

    select,
    button {
      font-size: 13px;
      display: none;
      position: absolute;
      z-index: 1;
      top: 4px;
      right: 4px;
    }

    &:hover {
      select {
        display: ${props => (props.readOnly ? "none" : "inline")};
      }

      button {
        display: ${props => (props.readOnly ? "inline" : "none")};
      }
    }

    select:focus,
    select:active {
      display: inline;
    }
  }

  pre {
    display: block;
    overflow-x: auto;
    padding: 0.75em 1em;
    line-height: 1.4em;
    position: relative;
    background: ${props => props.theme.codeBackground};
    border-radius: 4px;
    border: 1px solid ${props => props.theme.codeBorder};

    -webkit-font-smoothing: initial;
    font-family: ${props => props.theme.fontFamilyMono};
    font-size: 13px;
    direction: ltr;
    text-align: left;
    white-space: pre;
    word-spacing: normal;
    word-break: normal;
    -moz-tab-size: 4;
    -o-tab-size: 4;
    tab-size: 4;
    -webkit-hyphens: none;
    -moz-hyphens: none;
    -ms-hyphens: none;
    hyphens: none;
    color: ${props => props.theme.code};
    margin: 0;

    code {
      font-size: 13px;
      background: none;
      padding: 0;
      border: 0;
    }
  }

  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: ${props => props.theme.codeComment};
  }

  .token.punctuation {
    color: ${props => props.theme.codePunctuation};
  }

  .token.namespace {
    opacity: 0.7;
  }

  .token.operator,
  .token.boolean,
  .token.number {
    color: ${props => props.theme.codeNumber};
  }

  .token.property {
    color: ${props => props.theme.codeProperty};
  }

  .token.tag {
    color: ${props => props.theme.codeTag};
  }

  .token.string {
    color: ${props => props.theme.codeString};
  }

  .token.selector {
    color: ${props => props.theme.codeSelector};
  }

  .token.attr-name {
    color: ${props => props.theme.codeAttr};
  }

  .token.entity,
  .token.url,
  .language-css .token.string,
  .style .token.string {
    color: ${props => props.theme.codeEntity};
  }

  .token.attr-value,
  .token.keyword,
  .token.control,
  .token.directive,
  .token.unit {
    color: ${props => props.theme.codeKeyword};
  }

  .token.function {
    color: ${props => props.theme.codeFunction};
  }

  .token.statement,
  .token.regex,
  .token.atrule {
    color: ${props => props.theme.codeStatement};
  }

  .token.placeholder,
  .token.variable {
    color: ${props => props.theme.codePlaceholder};
  }

  .token.deleted {
    text-decoration: line-through;
  }

  .token.inserted {
    border-bottom: 1px dotted ${props => props.theme.codeInserted};
    text-decoration: none;
  }

  .token.italic {
    font-style: italic;
  }

  .token.important,
  .token.bold {
    font-weight: bold;
  }

  .token.important {
    color: ${props => props.theme.codeImportant};
  }

  .token.entity {
    cursor: help;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    border-radius: 4px;
    margin-top: 1em;

    tr {
      position: relative;
      border-bottom: 1px solid ${props => props.theme.tableDivider};
    }

    th {
      background: ${props => props.theme.tableHeaderBackground};
    }

    td,
    th {
      position: relative;
      vertical-align: top;
      border: 1px solid ${props => props.theme.tableDivider};
      position: relative;
      padding: 4px 8px;
      text-align: left;
      min-width: 100px;
    }

    .selectedCell {
      background: ${props =>
    props.readOnly ? "inherit" : props.theme.tableSelectedBackground};
    }

    .grip-column {
      cursor: pointer;
      position: absolute;
      top: -16px;
      left: 0;
      width: 100%;
      height: 12px;
      background: ${props => props.theme.tableDivider};
      border-bottom: 3px solid ${props => props.theme.background};
      display: ${props => (props.readOnly ? "none" : "block")};

      &:hover {
        background: ${props => props.theme.text};
      }
      &.first {
        border-top-left-radius: 3px;
      }
      &.last {
        border-top-right-radius: 3px;
      }
      &.selected {
        background: ${props => props.theme.tableSelected};
      }
    }

    .grip-row {
      cursor: pointer;
      position: absolute;
      left: -16px;
      top: 0;
      height: 100%;
      width: 12px;
      background: ${props => props.theme.tableDivider};
      border-right: 3px solid ${props => props.theme.background};
      display: ${props => (props.readOnly ? "none" : "block")};

      &:hover {
        background: ${props => props.theme.text};
      }
      &.first {
        border-top-left-radius: 3px;
      }
      &.last {
        border-bottom-left-radius: 3px;
      }
      &.selected {
        background: ${props => props.theme.tableSelected};
      }
    }

    .grip-table {
      cursor: pointer;
      background: ${props => props.theme.tableDivider};
      width: 13px;
      height: 13px;
      border-radius: 13px;
      border: 2px solid ${props => props.theme.background};
      position: absolute;
      top: -18px;
      left: -18px;
      display: ${props => (props.readOnly ? "none" : "block")};

      &:hover {
        background: ${props => props.theme.text};
      }
      &.selected {
        background: ${props => props.theme.tableSelected};
      }
    }
  }

  .scrollable-wrapper {
    position: relative;
    margin: 0.5em 0px;
  }

  .scrollable {
    overflow-y: hidden;
    overflow-x: scroll;
    padding-left: 1em;
    margin-left: -1em;
    border-left: 1px solid transparent;
    border-right: 1px solid transparent;
    transition: border 250ms ease-in-out 0s;
  }

  .scrollable-shadow {
    position: absolute;
    top: 0;
    bottom: 0;
    left: -1em;
    width: 16px;
    transition: box-shadow 250ms ease-in-out;
    border: 0px solid transparent;
    border-left-width: 1em;
    pointer-events: none;

    &.left {
      box-shadow: 16px 0 16px -16px inset rgba(0, 0, 0, 0.25);
      border-left: 1em solid ${props => props.theme.background};
    }

    &.right {
      right: 0;
      left: auto;
      box-shadow: -16px 0 16px -16px inset rgba(0, 0, 0, 0.25);
    }
  }

  .block-menu-trigger {
    display: ${props => (props.readOnly ? "none" : "block")};
    height: 1em;
    color: ${props => props.theme.textSecondary};
    background: none;
    border-radius: 100%;
    font-size: 30px;
    position: absolute;
    transform: scale(0.9);
    transition: color 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275),
      transform 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
    outline: none;
    border: 0;
    line-height: 1;
    margin-top: -6px;
    left: -34px;

    &:hover,
    &:focus {
      cursor: pointer;
      transform: scale(1);
      color: ${props => props.theme.text};
    }
  }

  .ProseMirror-gapcursor {
    display: none;
    pointer-events: none;
    position: absolute;
  }

  .ProseMirror-gapcursor:after {
    content: "";
    display: block;
    position: absolute;
    top: -2px;
    width: 20px;
    border-top: 1px solid ${props => props.theme.cursor};
    animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite;
  }

  @keyframes ProseMirror-cursor-blink {
    to {
      visibility: hidden;
    }
  }

  .ProseMirror-focused .ProseMirror-gapcursor {
    display: block;
  }
`;

export default RichMarkdownEditor;
