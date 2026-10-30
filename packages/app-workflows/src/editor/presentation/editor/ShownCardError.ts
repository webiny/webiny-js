// The error the card strip shows, as `buildStepCardVm` composes it (R303).
export interface ShownCardError {
    // The strip text, `Rule {n}: {message}` for a rule error.
    text: string;
    // `Rule {n}: ` when the strip is a rule's error, else null.
    rulePrefix: string | null;
}
