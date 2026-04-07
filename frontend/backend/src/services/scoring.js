export function computeAiTotal(ai) {
  return (
    Number(ai.functionalEquivalence || 0) +
    Number(ai.logicalCorrectness || 0) +
    Number(ai.timeComplexitySimilarity || 0) +
    Number(ai.spaceComplexitySimilarity || 0) +
    Number(ai.readability || 0)
  );
}

export function computeTimeScore(timeTaken, expectedTimeSeconds = 900) {
  if (!timeTaken || timeTaken <= 0) {
    return 100;
  }

  const ratio = Math.max(0, Math.min(2, timeTaken / expectedTimeSeconds));
  return Number((100 - ratio * 50).toFixed(2));
}

export function computeFinalScore({ accuracyScore }) {
  return Number((accuracyScore || 0).toFixed(2));
}
