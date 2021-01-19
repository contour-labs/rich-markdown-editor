import markdownit from "markdown-it";
import markPlugin from "markdown-it-mark";
import checkboxPlugin from "./checkboxes";
import embedsPlugin from "./embeds";
import breakPlugin from "./breaks";
import tablesPlugin from "./tables";
import iterator from "markdown-it-for-inline"
import Token from "markdown-it/lib/token";
import mergeConflictPlugin from "./mergeConflictPlugin";

export default function rules({ embeds }) {
  return markdownit("default", {
    breaks: false,
    html: false,
  })
    // .use(iterator, 'logger', 'text', function (tokens: Token[], idx: number) {
    //   const currentToken = tokens[idx]
    //   console.log(tokens, idx, currentToken.content)
    // })
    .use(embedsPlugin(embeds))
    .use(breakPlugin)
    .use(checkboxPlugin)
    .use(markPlugin)
    .use(tablesPlugin)
    .use(mergeConflictPlugin)
}
