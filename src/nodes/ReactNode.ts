import Node from "./Node"
import { ComponentOptions } from "../lib/ComponentView"

export default abstract class ReactNode extends Node {

  abstract component(options: ComponentOptions): React.ReactElement;

}
