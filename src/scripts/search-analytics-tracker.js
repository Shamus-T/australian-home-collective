export const SEARCH_ANALYTICS_DEBOUNCE_MS = 1200;
export const MINIMUM_VISIBLE_QUERY_CHARACTERS = 3;
export const MAXIMUM_ANALYTICS_QUERY_LENGTH = 120;

export function normaliseAnalyticsQuery(value) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/\s+/gu, " ")
    .toLowerCase()
    .slice(0, MAXIMUM_ANALYTICS_QUERY_LENGTH);
}

export function visibleQueryCharacterCount(value) {
  return [...normaliseAnalyticsQuery(value).replace(/\s/gu, "")].length;
}

export function createSearchAnalyticsTracker({
  recordEvent,
  debounceMs = SEARCH_ANALYTICS_DEBOUNCE_MS,
  schedule = (callback, delay) => window.setTimeout(callback, delay),
  cancel = (timer) => window.clearTimeout(timer),
}) {
  if (typeof recordEvent !== "function") {
    throw new TypeError("recordEvent must be a function.");
  }

  let pendingTimer = null;
  let pendingCompletion = null;
  let currentNormalisedQuery = "";
  let queryRevision = 0;
  let currentSearchResult = null;
  let lastSearchResult = null;
  let lastRecordedQuery = "";
  let lastRecordedRevision = -1;
  let lastRecordedTrigger = "";

  const cancelTimer = () => {
    if (pendingTimer !== null) {
      cancel(pendingTimer);
      pendingTimer = null;
    }
  };

  const cancelPending = () => {
    cancelTimer();
    pendingCompletion = null;
  };

  const isTrackableQuery = (query) =>
    visibleQueryCharacterCount(query) >= MINIMUM_VISIBLE_QUERY_CHARACTERS;

  const recordCompletedSearch = ({
    query,
    resultCount,
    trigger,
    revision = queryRevision,
  }) => {
    const normalisedQuery = normaliseAnalyticsQuery(query);
    cancelTimer();

    if (
      !isTrackableQuery(normalisedQuery)
      || !Number.isInteger(resultCount)
      || resultCount < 0
    ) {
      return false;
    }

    if (
      normalisedQuery === lastRecordedQuery
      && revision === lastRecordedRevision
    ) {
      if (
        pendingCompletion?.query === normalisedQuery
        && pendingCompletion.revision === revision
      ) {
        pendingCompletion = null;
      }
      return false;
    }

    lastRecordedQuery = normalisedQuery;
    lastRecordedRevision = revision;
    lastRecordedTrigger = trigger;
    if (
      pendingCompletion?.query === normalisedQuery
      && pendingCompletion.revision === revision
    ) {
      pendingCompletion = null;
    }

    recordEvent({
      eventType: "search",
      query: normalisedQuery,
      resultCount,
    });
    return true;
  };

  const finishPendingCompletion = () => {
    if (!pendingCompletion || !currentSearchResult) return false;
    if (
      pendingCompletion.query !== currentSearchResult.query
      || pendingCompletion.revision !== currentSearchResult.revision
    ) {
      return false;
    }

    return recordCompletedSearch({
      ...pendingCompletion,
      resultCount: currentSearchResult.resultCount,
    });
  };

  const completeSearch = (trigger) => {
    cancelTimer();
    if (!isTrackableQuery(currentNormalisedQuery)) {
      pendingCompletion = null;
      return false;
    }

    pendingCompletion = {
      query: currentNormalisedQuery,
      revision: queryRevision,
      trigger,
    };
    return finishPendingCompletion();
  };

  const handleQueryChange = (query, { active = false } = {}) => {
    const normalisedQuery = normaliseAnalyticsQuery(query);

    if (normalisedQuery !== currentNormalisedQuery) {
      cancelPending();
      currentNormalisedQuery = normalisedQuery;
      queryRevision += 1;
      currentSearchResult = null;
    } else if (active) {
      // Restart the completion window for raw casing or whitespace edits that
      // intentionally normalise to the same analytics phrase.
      cancelPending();
    }

    if (!active || !isTrackableQuery(normalisedQuery)) return;

    const scheduledQuery = normalisedQuery;
    const scheduledRevision = queryRevision;
    pendingTimer = schedule(() => {
      pendingTimer = null;
      if (
        scheduledQuery !== currentNormalisedQuery
        || scheduledRevision !== queryRevision
      ) {
        return;
      }
      pendingCompletion = {
        query: scheduledQuery,
        revision: scheduledRevision,
        trigger: "debounce",
      };
      finishPendingCompletion();
    }, debounceMs);
  };

  const handleResults = (query, resultCount) => {
    const normalisedQuery = normaliseAnalyticsQuery(query);
    if (!Number.isInteger(resultCount) || resultCount < 0) return;

    const revision = normalisedQuery === currentNormalisedQuery
      ? queryRevision
      : -1;
    const result = { query: normalisedQuery, resultCount, revision };
    lastSearchResult = result;

    if (normalisedQuery === currentNormalisedQuery) {
      currentSearchResult = result;
      finishPendingCompletion();
    }
  };

  const recordResultClick = (selectedPath) => {
    cancelPending();
    if (!lastSearchResult || !isTrackableQuery(lastSearchResult.query)) {
      return false;
    }

    recordCompletedSearch({
      ...lastSearchResult,
      trigger: "result-click",
    });
    recordEvent({
      eventType: "result_click",
      query: lastSearchResult.query,
      resultCount: lastSearchResult.resultCount,
      selectedPath,
    });
    return true;
  };

  const getState = () => ({
    currentNormalisedQuery,
    lastRecordedQuery,
    lastRecordedTrigger,
    queryRevision,
    lastRecordedRevision,
    hasPendingTimer: pendingTimer !== null,
    pendingTrigger: pendingCompletion?.trigger ?? "",
  });

  return {
    cancelPending,
    completeSearch,
    getState,
    handleQueryChange,
    handleResults,
    recordCompletedSearch,
    recordResultClick,
  };
}
