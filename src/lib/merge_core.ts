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

export const parseConflicts = (fileContents: string): (MergeConflict | string)[] => {
  const conflictSeeker = /<<<<<<< HEAD\n([\s\S]+?(?=\n=======))\n=======\n([\s\S]+?(?=\n>>>>>>> [a-z0-9]+\n))(\n>>>>>>> [a-z0-9]+\n)/g
  const conflicts: (MergeConflict | string)[] = []
  let matches: RegExpExecArray | null;

  while ((matches = conflictSeeker.exec(fileContents)) != null) {
    const [fullMatch, mine, theirs, tail] = matches
    const startIndex = matches.index
    const endIndex = startIndex + fullMatch.length
    conflicts.push(fileContents.slice(!conflicts.length ? 0 : (conflicts[conflicts.length - 1] as MergeConflict).endIndex, startIndex))
    conflicts.push({ mine, theirs, startIndex, endIndex, tail })
  }
  if (conflicts.length) {
    conflicts.push(fileContents.slice((conflicts[conflicts.length - 1] as MergeConflict).endIndex))
  } else {
    conflicts.push(fileContents)
  }

  return conflicts
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