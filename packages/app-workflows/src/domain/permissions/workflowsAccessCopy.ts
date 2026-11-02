// Copy of the role form's Workflows group (design DS:103-135, QBZ-77, R333; Copy gap 1 for `levelLabel`).
export const WORKFLOWS_ACCESS_COPY = {
    title: "Workflows",
    description: "Publishing workflows for Headless CMS and Website Builder",
    levelLabel: "Access level",
    noAccess: "No access",
    fullAccess: "Full access",
    custom: "Custom",
    editorLabel: "Manage workflows",
    editorDescription:
        "Create and edit workflows, manage reviewer exclusions, and use routing tools such as Test routing.",
    reassignLabel: "Reassign and operate",
    reassignDescription:
        "Reassign reviewers, restart failed automated steps, and cancel reviews requested by others.",
    noAccessNote:
        "Can't build workflows or operate reviews. Can still review content as a member of a reviewing team.",
    fullAccessNote: "Includes Manage workflows and Reassign and operate.",
    customNoneNote: "With nothing selected, this role has the same access as No access.",
    customBothNote:
        "Same as Full access today. Full access also gets workflow permissions added in later versions; Custom doesn't.",
    reviewingNote:
        "Reviewing is not a permission. Anyone in a step's reviewing teams who can read the content can review it."
} as const;
