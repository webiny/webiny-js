/*
 * Copy of the People step's Assignment tab and its pickers (R285, R297, R307, R308, R313;
 * `research-spec.md` 4.2 and 7). Strings with a parameter are functions so the sentence stays whole.
 */
export const ASSIGNMENT_FORM_MESSAGES = {
    tabGeneral: "General",
    tabAssignment: "Assignment",
    tabTestRouting: "Test routing",
    strategyLabel: "Strategy",
    allowManualPickLabel: "Let the requester pick a reviewer",
    allowManualPickHint:
        "The requester can choose a person from this step's eligible reviewers when requesting a review. Picks are checked again when the step is reached.",
    rulesLabel: "Routing rules",
    rulesHint: "The first matching rule wins. If no rule matches, the strategy decides.",
    addRule: "Add rule",
    emptyRulesLead: "No rules. ",
    emptyRulesPool: "Reviews wait in the team pool.",
    emptyRulesStrategy: "The strategy picks the reviewer.",
    moveRuleUp: "Move rule up",
    moveRuleDown: "Move rule down",
    deleteRule: "Delete rule",
    requesterUserLabel: "Requester is",
    anyUser: "Anyone",
    requesterTeamLabel: "Requester is in team",
    anyTeam: "Any team",
    folderLabel: "Content is in folder",
    anyFolder: "Any folder",
    removeFolder: "Remove",
    removeFolderTitle: "Remove the folder condition",
    restrictedFolderHint:
        "You can't see this folder. The condition stays as it is unless you remove it.",
    includeSubfolders: "Include subfolders",
    targetLabel: "Then assign to",
    targetPlaceholder: "Search reviewers or teams",
    targetHint: "Only members of this step's reviewing teams, or one of those teams.",
    searchUsersPlaceholder: "Search users",
    searchFoldersPlaceholder: "Search folders",
    ruleTitle: (position: number): string => {
        return `Rule ${position}`;
    },
    teamPool: (team: string): string => {
        return `${team} team pool`;
    },
    notInReviewingTeams: (name: string): string => {
        return `${name} (not in reviewing teams)`;
    },
    ruleMoved: (position: number, total: number): string => {
        return `Rule moved to position ${position} of ${total}.`;
    }
} as const;
