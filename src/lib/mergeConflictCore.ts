export enum Resolution {
  Mine,
  Theirs,
  Both
}

export type Opt<T> = T | undefined

export interface MergeConflict {
  startIndex: number,
  endIndex: number
  mine: string
  theirs: string
  tail: string
}

export const parseConflicts = (fileContents: string): { partitions: (MergeConflict | string)[], conflictCount: number } | false => {
  const conflictSeeker = /<<<<<<< HEAD\n([\s\S]+?(?=\n=======))\n=======\n([\s\S]+?(?=\n>>>>>>> [a-z0-9]+\n))(\n>>>>>>> [a-z0-9]+\n)/g
  const partitions: (MergeConflict | string)[] = []
  let matches: RegExpExecArray | null;
  let conflictCount = 0

  while ((matches = conflictSeeker.exec(fileContents)) != null) {
    conflictCount += 1

    const [fullMatch, mine, theirs, tail] = matches
    const startIndex = matches.index
    const endIndex = startIndex + fullMatch.length

    // Everything (unconflicted portion of document) lying between either the start of the document and
    // the first conflict or the end of the previous conflict and the start the current one
    const intermediateStartIndex = !partitions.length ? 0 : (partitions[partitions.length - 1] as MergeConflict).endIndex
    const intermediateEndIndex = startIndex
    if (intermediateStartIndex !== intermediateEndIndex) {
      partitions.push(fileContents.slice(intermediateStartIndex, intermediateEndIndex))
    }

    partitions.push({ mine, theirs, startIndex, endIndex, tail })
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

export const resolveConflict = (contents: string, conflictsSlice: MergeConflict[], resolution: Resolution): string => {
  const { mine, theirs, startIndex, endIndex } = conflictsSlice[0]

  let resolvedContent: string
  switch (resolution) {
    case Resolution.Mine:
      resolvedContent = mine
      break
    case Resolution.Theirs:
      resolvedContent = theirs
      break
    case Resolution.Both:
      resolvedContent = mine + theirs
      break
  }

  const output = contents.slice(0, startIndex) + resolvedContent + contents.slice(endIndex)

  // When a subset of the entire conflict match (mine, theirs or both) replaces the entire conflict match, the old indices
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