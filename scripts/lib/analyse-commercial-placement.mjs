const countMatches = (value, pattern) => value.match(pattern)?.length ?? 0;

const stripFrontmatter = (source) => source.replace(/^---\s*[\r\n][\s\S]*?[\r\n]---\s*[\r\n]/, "");

const authoredWordCount = (source) => {
  const text = stripFrontmatter(source)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(?:CommercialProductBlock|RelatedGuidesBlock|FAQSection|CommonQuestions)\b[\s\S]*?\/>/gi, " ")
    .replace(/<(?:script|style)\b[\s\S]*?<\/(?:script|style)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{[\s\S]*?\}/g, " ")
    .replace(/&(?:[a-z]+|#\d+|#x[\da-f]+);/gi, " ");
  return text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
};

const h2Labels = (source) => [...source.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)]
  .map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());

export function analyseCommercialPlacement(source) {
  const commercialIndex = source.indexOf("<CommercialProductBlock");
  if (commercialIndex === -1) return null;

  const blockEnd = source.indexOf("/>", commercialIndex);
  const before = source.slice(0, commercialIndex);
  const after = blockEnd === -1 ? source.slice(commercialIndex) : source.slice(blockEnd + 2);
  const sectionsBefore = countMatches(before, /<h2\b/gi);
  const sectionsAfter = countMatches(after, /<h2\b/gi);
  const beforeWords = authoredWordCount(before);
  const afterWords = authoredWordCount(after);
  const totalWords = beforeWords + afterWords;
  const percentBefore = totalWords === 0 ? 0 : Math.round((beforeWords / totalWords) * 100);
  const priorHeadings = h2Labels(before);
  const markersBefore = [];

  if (/<RelatedGuidesBlock\b/i.test(before)) markersBefore.push("related-guide navigation");
  if (/<(?:FAQSection|CommonQuestions)\b/i.test(before)
      || priorHeadings.some((heading) => /\b(?:common questions|frequently asked questions|faq)\b/i.test(heading))) {
    markersBefore.push("FAQ content");
  }
  if (priorHeadings.some((heading) => /^(?:official guidance|sources(?: and guidance)?|references)$/i.test(heading))) {
    markersBefore.push("sources or official guidance");
  }
  if (priorHeadings.some((heading) => /\b(?:conclusion|final verdict|final word)\b/i.test(heading))) {
    markersBefore.push("a conclusion");
  }

  return {
    sectionsBefore,
    sectionsAfter,
    sectionNumber: sectionsBefore + 1,
    totalSubstantiveSections: sectionsBefore + sectionsAfter + 1,
    beforeWords,
    afterWords,
    totalWords,
    percentBefore,
    markersBefore,
    finalQuarterWarning: percentBefore >= 75,
  };
}

