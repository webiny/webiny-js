// What a rule card shows of its issues and server errors (R299, R303).
export interface RuleFieldMessages {
    // The message under each field: the server error of that field, else its live error issue.
    target: string | null;
    requesterUser: string | null;
    requesterTeam: string | null;
    folder: string | null;
    // True when the rule holds an error of either kind: the card gets the destructive border.
    hasError: boolean;
    // The rule's warnings in order, without the `Rule {n}:` prefix (that is for the step card and the drawer top).
    warnings: string[];
}
