import MarkdownIt from 'markdown-it'

const MergeParser: MarkdownIt.PluginSimple = md => {
  const { core } = md
  const test = core
  console.log(test)
}

export default MergeParser
