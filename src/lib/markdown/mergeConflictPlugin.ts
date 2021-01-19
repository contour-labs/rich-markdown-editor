import { PluginSimple } from "markdown-it"
import Token = require("markdown-it/lib/token")

interface Range {
  start: number
  end: number
}

export enum ConflictIdentity {
  CURRENT = "current",
  INCOMING = "incoming"
}

export const conflictColors = new Map<ConflictIdentity, string>([
  [ConflictIdentity.CURRENT, "#c6d2fe"],
  [ConflictIdentity.INCOMING, "#baf7d0"]
])

const openingLength = 7
const contentLength = 3
const closingLength = 7
const tailLength = openingLength + contentLength + closingLength

const mergeConflictPlugin: PluginSimple = md => {
  md.core.ruler.push('mergeConflict', ({ tokens }) => {
    console.log("INITIAL", tokens)
    const conflicts: Conflict[] = []
    for (let curr = 0; curr < tokens.length; curr++) {
      if (tokens[curr].type === "inline" && /^<<<<<<< HEAD$/g.test(tokens[curr].content)) {
        console.log("FOUND HEAD")
        const conflict = new Conflict()
        const headEnd = curr + 2
        conflict.head = { start: curr - 1, end: headEnd }

        for (curr = headEnd; curr < tokens.length; curr++) {
          console.log("FOUND SEPARATOR")
          if (tokens[curr].type === "inline" && /^=======$/g.test(tokens[curr].content)) {
            conflict.current = { start: conflict.head.end, end: curr - 1 }
            const separatorEnd = curr + 2
            conflict.separator = { start: curr - 1, end: separatorEnd }

            for (curr = separatorEnd; curr < tokens.length; curr++) {
              const contentStart = curr + openingLength
              const contentEnd = contentStart + contentLength
              const tailEnd = curr + tailLength
              if (tokens[curr].type === "blockquote_open" && tailEnd <= tokens.length) {
                console.log("FOUND TAIL")
                const potentialOpeners = tokens.slice(curr, contentStart)
                const potentialClosers = tokens.slice(contentEnd, tailEnd)
                if (potentialOpeners.every(({ type }) => type === "blockquote_open") && potentialClosers.every(({ type }) => type === "blockquote_close")) {
                  const [p_open, inline, p_close] = tokens.slice(contentStart, contentEnd)
                  if (p_open.type === "paragraph_open" && inline.type === "inline" && p_close.type === "paragraph_close") {
                    if (/^[a-z0-9]{40}$/g.test(inline.content)) {
                      conflict.incoming = { start: conflict.separator.end, end: curr }
                      conflict.tail = { start: curr, end: tailEnd }
                      conflict.commitHash = inline.content
                      conflicts.push(conflict)
                      curr = tailEnd - 1
                      break
                    }
                  }
                }
              }
            }

            break
          }
        }

      }
    }

    let globalOffset = 0
    for (let i = 0; i < conflicts.length; i++) {
      globalOffset += conflicts[i].apply(tokens, i, globalOffset)
    }

    console.log("PROCESSED", tokens)

    return false
  })
}

class Conflict {

  public id: number
  public head: Range
  public current: Range
  public separator: Range
  public incoming: Range
  public tail: Range
  public commitHash: string

  public apply(tokens: Token[], conflictId: number, globalOffset: number): number {
    const { head, current, separator, incoming, tail, commitHash } = this

    for (const token of tokens.slice(current.start - globalOffset, current.end - globalOffset)) {
      token.attrPush(["conflictId", `${conflictId}`])
      token.attrPush(["conflictIdentity", ConflictIdentity.CURRENT])
      token.attrPush(["commitHash", commitHash])
    }

    for (const token of tokens.slice(incoming.start - globalOffset, incoming.end - globalOffset)) {
      token.attrPush(["conflictId", `${conflictId}`])
      token.attrPush(["conflictIdentity", ConflictIdentity.INCOMING])
      token.attrPush(["commitHash", commitHash])
    }

    let localOffset = 0
    for (const { start, end } of [head, separator, tail]) {
      const deleteCount = end - start
      tokens.splice(start - localOffset - globalOffset, deleteCount)
      localOffset += deleteCount
    }

    return localOffset
  }

}

export default mergeConflictPlugin