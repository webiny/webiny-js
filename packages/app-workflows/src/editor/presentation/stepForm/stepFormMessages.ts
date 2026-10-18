import { HEX_COLOUR_MESSAGE } from "~/editor/domain/stepColours.js";

// Copy of the common and People step forms (research-spec.md 4, contract-review-1.md string list, Q43).
export const STEP_FORM_MESSAGES = {
    titleRequired: "Enter a title for this step.",
    teamsRequired: "Choose at least one reviewing team.",
    teamsHint:
        "Members of these teams can review. Routing rules can narrow a review to one team or person. Set up who is chosen on the Assignment tab.",
    teamsPlaceholder: "Search teams",
    teamHasNoMembers: "This team has no members",
    hexColour: HEX_COLOUR_MESSAGE,
    notifyHint:
        "In-app notifications are always sent. Who gets notified is set automatically from the step.",
    noTransports: "Only in-app notifications are available. No other channels are configured.",
    optionsFailed: "Could not load the step options.",
    tryAgain: "Try again",
    peopleDescriptionPlaceholder: "What reviewers should look for in this step"
} as const;
