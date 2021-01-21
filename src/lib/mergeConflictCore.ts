import { ConflictIdentity } from "../nodes/customRenderNodes/mergeConflict/MergeConflict";
import { Fragment, NodeType, Node } from "prosemirror-model";
import { MarkdownParser } from "prosemirror-markdown";

export enum Resolution {
  Current,
  Incoming,
  Both
}

export type Opt<T> = T | undefined

export interface MergeConflict {
  startIndex: number,
  endIndex: number
  current: string
  incoming: string
  commitHash: string
}

type NodeDict = { [name: string]: NodeType }

type Partition = MergeConflict | string

interface RegexParseResults {
  partitions: Partition[],
  conflictCount: number
}

export const regexParseConflicts = (fileContents: string): RegexParseResults | false => {
  const conflictSeeker = /<<<<<<< HEAD\n([\s\S]+?(?=\n=======))\n=======\n([\s\S]+?(?=\n>>>>>>> [a-z0-9]+\n))\n>>>>>>> ([a-z0-9]+\n)/g
  const partitions: (MergeConflict | string)[] = []
  let matches: RegExpExecArray | null;
  let conflictCount = 0

  while ((matches = conflictSeeker.exec(fileContents)) != null) {
    conflictCount += 1

    const [fullMatch, current, incoming, commitHash] = matches
    const startIndex = matches.index
    const endIndex = startIndex + fullMatch.length

    // Everything (unconflicted partition of document) lying between either the start of the document and
    // the first conflict or the end of the previous conflict and the start the current one
    const intermediateStartIndex = !partitions.length ? 0 : (partitions[partitions.length - 1] as MergeConflict).endIndex
    const intermediateEndIndex = startIndex
    if (intermediateStartIndex !== intermediateEndIndex) {
      partitions.push(fileContents.slice(intermediateStartIndex, intermediateEndIndex))
    }

    partitions.push({ current, incoming, startIndex, endIndex, commitHash })
  }

  if (partitions.length) {
    const startIndex = (partitions[partitions.length - 1] as MergeConflict).endIndex
    if (startIndex != fileContents.length) {
      partitions.push(fileContents.slice(startIndex))
    }
  } else {
    return false
  }

  return { partitions, conflictCount }
}

export const documentWithConflicts = (markdownParser: MarkdownParser, results: RegexParseResults, nodeDict: NodeDict): Node => {
  const { partitions, conflictCount } = results
  const { doc, unconflicted, merge_conflict, merge_section } = nodeDict

  let conflictId = 0

  const partitionToNode = (partition: Partition): Node => {
    if (typeof partition === "string") {
      return unconflicted.create({}, markdownParser.parse(partition).content)
    }
    const { current, incoming, commitHash } = partition

    const mergeConflict = merge_conflict.create(
      { conflictId, commitHash },
      Fragment.fromArray([
        merge_section.create(
          { identity: ConflictIdentity.CURRENT, conflictId, commitHash },
          markdownParser.parse(current).content
        ),
        merge_section.create(
          { identity: ConflictIdentity.INCOMING, conflictId, commitHash },
          markdownParser.parse(incoming).content
        )
      ])
    )

    conflictId += 1

    return mergeConflict
  }

  return doc.create(
    { conflictCount },
    Fragment.fromArray(partitions.map(partitionToNode))
  )
}

export const resolveConflict = (contents: string, conflictsSlice: MergeConflict[], resolution: Resolution): string => {
  const { current, incoming, startIndex, endIndex } = conflictsSlice[0]

  let resolvedContent: string
  switch (resolution) {
    case Resolution.Current:
      resolvedContent = current
      break
    case Resolution.Incoming:
      resolvedContent = incoming
      break
    case Resolution.Both:
      resolvedContent = current + incoming
      break
  }

  const output = contents.slice(0, startIndex) + resolvedContent + contents.slice(endIndex)

  // When a subset of the entire conflict match (current, incoming or both) replaces the entire conflict match, the old indices
  // found in the regex passes *for subsequent conflicts* will be too large since the content that precedes it is
  // now shorted. Correct this by subtracting the difference between the entire conflict match and the replacement
  // from all of the subsequent indices, if any.
  const indexUpdate = resolvedContent.length - (endIndex - startIndex)
  for (const remaining of conflictsSlice.slice(1)) {
    remaining.startIndex += indexUpdate
    remaining.endIndex += indexUpdate
  }

  return output
}

export const resolveFile = (contents: string, allConflicts: MergeConflict[], allResolutions: Resolution[]): string => {
  let output = contents
  for (let i = 0; i < allConflicts.length; i++) {
    output = resolveConflict(output, allConflicts.slice(i), allResolutions[i])
  }
  return output
}