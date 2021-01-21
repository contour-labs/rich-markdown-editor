import LocalNode from "../LocalNode";
import { ComponentOptions } from "../../lib/ComponentView";

export default abstract class ReactNode extends LocalNode {

  abstract component(options: ComponentOptions): React.ReactElement;

}