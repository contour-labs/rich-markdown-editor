import CodeFence from "./CodeFence";

export default class CodeBlock extends CodeFence {

  get name(): string {
    return "code_block";
  }

  get markdownToken(): string {
    return "code_block";
  }

}
