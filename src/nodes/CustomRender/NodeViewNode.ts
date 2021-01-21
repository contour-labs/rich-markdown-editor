import LocalNode from "../LocalNode"
import { NodeViewConstructor } from "../.."

export default abstract class NodeWithNodeView extends LocalNode {

  abstract get nodeViewConstructor(): NodeViewConstructor;

}
