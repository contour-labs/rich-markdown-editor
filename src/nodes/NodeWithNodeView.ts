import Node from "./Node"
import { NodeViewConstructor } from ".."

export default abstract class NodeWithNodeView extends Node {

  abstract get nodeViewConstructor(): NodeViewConstructor;

}
