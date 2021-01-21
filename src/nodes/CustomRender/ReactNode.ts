import NodeViewNode from "../LocalNode";
import ComponentView, { ComponentOptions } from "../../lib/ComponentView";
import { NodeViewProps } from "./NodeViewNode";
import { NodeView } from "prosemirror-view";

export default abstract class ReactNode extends NodeViewNode {

  getNodeView(props: NodeViewProps): NodeView {
    return new ComponentView(this.component, props);
  }

  abstract component(options: ComponentOptions): React.ReactElement;

}