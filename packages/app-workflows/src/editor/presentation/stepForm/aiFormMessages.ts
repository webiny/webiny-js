// Copy of the AI step form (research2-admin.md 5; QBZ-8, QBZ-39, QBZ-46, QBZ-47, QBZ-89, R281).
export const AI_FORM_MESSAGES = {
    descriptionPlaceholder: "What this AI check is for. Shown to the requester and reviewers.",
    instructionsPlaceholder: "Check tone of voice, flag any personal data…",
    instructionsHint:
        "The AI reviews the revision against these instructions, then approves or rejects it and lists the issues it found.",
    instructionsRequired: "Enter instructions for the AI.",
    modelHint: "Models available through AI Power-Ups.",
    modelRequired: "Choose an AI model.",
    modelPlaceholder: "Search models",
    modelsFailed: "Could not load AI models.",
    modelsEmpty: "No AI models are available. Check the AI Power-Ups configuration.",
    changesContentTag: "Changes content",
    toolsHint:
        "Tools marked “Changes content” can edit the revision while it is in review. The editor reloads and tells the author when that happens.",
    retry: "Retry",
    licenceTitle: "AI Power-Ups licence missing",
    licenceText:
        "This step is read-only. Reviews that reach it fail; they can be restarted once the licence is back."
} as const;
