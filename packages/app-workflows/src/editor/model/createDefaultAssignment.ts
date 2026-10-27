export interface DefaultAssignment {
    strategy: "none";
    allowManualPick: false;
    rules: never[];
}

/*
 * The review config the server requires in full (`research-api.md` gap 9): a step without an
 * assignment gets it. 9a does not edit the assignment (R270), it only creates and carries it.
 */
export const createDefaultAssignment = (): DefaultAssignment => {
    return { strategy: "none", allowManualPick: false, rules: [] };
};
