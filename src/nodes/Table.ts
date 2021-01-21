import LocalNode from "./LocalNode";
import { DecorationSet, Decoration } from "prosemirror-view";
import {
  tableEditing,
  goToNextCell,
  addColumnBefore,
  addColumnAfter,
  deleteColumn,
  deleteRow,
  deleteTable,
  toggleHeaderColumn,
  toggleHeaderRow,
  toggleHeaderCell,
  setCellAttr,
  fixTables,
  isInTable,
} from "prosemirror-tables";
import {
  getCellsInColumn,
  createTable,
  moveRow,
  addRowAt,
} from "prosemirror-utils";
import { Plugin, TextSelection, EditorState, Transaction } from "prosemirror-state";
import { NodeSpec, Node } from "prosemirror-model";
import { ExtensionOptions, Command } from "../lib/Extension";
import { MarkdownSerializerState, TokenConfig } from "prosemirror-markdown";

export default class Table extends LocalNode {

  get name(): string {
    return "table";
  }

  get schema(): NodeSpec {
    return {
      content: "tr+",
      tableRole: "table",
      isolating: true,
      group: "block",
      parseDOM: [{ tag: "table" }],
      toDOM() {
        return [
          "div",
          { class: "scrollable-wrapper" },
          [
            "div",
            { class: "scrollable" },
            ["table", { class: "rme-table" }, ["tbody", 0]],
          ],
        ];
      },
    };
  }

  commands({ schema }: ExtensionOptions): Record<string, Command> | Command {
    return {
      createTable: ({ rowsCount, colsCount }) => (state, dispatch) => {
        const offset = state.tr.selection.anchor + 1;
        const nodes = createTable(schema, rowsCount, colsCount);
        const tr = state.tr.replaceSelectionWith(nodes).scrollIntoView();
        const resolvedPos = tr.doc.resolve(offset);

        tr.setSelection(TextSelection.near(resolvedPos));
        dispatch(tr);
      },
      setColumnAttr: ({ index, alignment }) => (state, dispatch) => {
        const cells = getCellsInColumn(index)(state.selection) || [];
        let transaction = state.tr;
        cells.forEach(({ pos }) => {
          transaction = transaction.setNodeMarkup(pos, undefined, {
            alignment,
          });
        });
        dispatch(transaction);
      },
      addColumnBefore: () => addColumnBefore,
      addColumnAfter: () => addColumnAfter,
      deleteColumn: () => deleteColumn,
      addRowAfter: ({ index }) => (state, dispatch) => {
        if (index === 0) {
          // A little hack to avoid cloning the heading row by cloning the row
          // beneath and then moving it to the right index.
          const tr = addRowAt(index + 2, true)(state.tr);
          dispatch(moveRow(index + 2, index + 1)(tr));
        } else {
          dispatch(addRowAt(index + 1, true)(state.tr));
        }
      },
      deleteRow: () => deleteRow,
      deleteTable: () => deleteTable,
      toggleHeaderColumn: () => toggleHeaderColumn,
      toggleHeaderRow: () => toggleHeaderRow,
      toggleHeaderCell: () => toggleHeaderCell,
      setCellAttr: (() => setCellAttr) as any,
      fixTables: (() => fixTables) as any,
    };
  }

  keys(): Record<string, any> {
    return {
      Tab: goToNextCell(1),
      "Shift-Tab": goToNextCell(-1),
      Enter: (state: EditorState, dispatch: (tr: Transaction) => void) => {
        if (!isInTable(state)) return false;

        // TODO: Adding row at the end for now, can we find the current cell
        // row index and add the row below that?
        const cells = getCellsInColumn(0)(state.selection) || [];

        dispatch(addRowAt(cells.length, true)(state.tr));
        return true;
      },
    };
  }

  toMarkdown(state: MarkdownSerializerState, node: Node): void {
    (state as any).renderTable(node);
    state.closeBlock(node);
  }

  parseMarkdown(): TokenConfig {
    return { block: "table" };
  }

  get plugins(): Plugin[] {
    return [
      tableEditing(),
      new Plugin({
        props: {
          decorations: state => {
            const { doc } = state;
            const decorations: Decoration[] = [];
            let index = 0;

            doc.descendants((node, pos) => {
              if (node.type.name !== this.name) return;

              const elements = document.getElementsByClassName("rme-table");
              const table = elements[index];
              if (!table) return;

              const element = table.parentElement;
              const shadowRight = !!(
                element && element.scrollWidth > element.clientWidth
              );

              if (shadowRight) {
                decorations.push(
                  Decoration.widget(pos + 1, () => {
                    const shadow = document.createElement("div");
                    shadow.className = "scrollable-shadow right";
                    return shadow;
                  })
                );
              }
              index++;
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  }

}
