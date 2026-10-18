import { TEAMS_OFF_STEP_MESSAGE } from "~/editor/model/teamsOffMessage.js";

// Copy of the step drawer (design README 4, R269, R270, R309).
export const STEP_DRAWER_MESSAGES = {
    untitledStep: "Untitled step",
    footerText: "Edits stay in this workflow until you save it.",
    done: "Done",
    warningsHeading: "Check this step",
    show: "Show",
    errorOnTab: (tab: string): string => `This step has an error on the ${tab} tab.`,
    teamsOffNotice: TEAMS_OFF_STEP_MESSAGE
} as const;
