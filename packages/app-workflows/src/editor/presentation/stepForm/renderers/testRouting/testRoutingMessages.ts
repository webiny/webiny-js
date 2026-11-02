// Copy of the Test routing tab (design README 4, research-spec.md 4.5 and 7, R300).
export const TEST_ROUTING_TAB_MESSAGES = {
    intro: "Test who would get this step, using the configuration on screen, including unsaved changes. Nothing is assigned and nobody is notified.",
    requesterLabel: "Requester",
    requesterPlaceholder: "Search users",
    folderLabel: "Folder",
    folderPlaceholder: "Search folders",
    rootFolder: "Root (no folder)",
    owner: "Owner",
    trace: "Trace",
    noRules: "No routing rules.",
    strategy: "Strategy",
    skippedPeople: "Skipped people",
    stale: "Out of date: the configuration or test inputs changed since this result.",
    testAgain: "Test again"
} as const;
