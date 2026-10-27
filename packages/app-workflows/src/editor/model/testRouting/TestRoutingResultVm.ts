export type TestRoutingTag = "Matched" | "Not matched" | "Skipped";

export interface TestRoutingRowVm {
    ruleId: string;
    tag: TestRoutingTag;
    // `Rule {n}: {summary}`, or `Rule {n}` when the rule is not among the rules of the request.
    label: string;
    reason: string;
}

export interface TestRoutingSkippedVm {
    name: string;
    reason: string;
}

// The render-ready Test routing result (R234, R301): sentences, no ids to resolve.
export interface TestRoutingResultVm {
    // The person's name, or `Team pool`.
    ownerLabel: string;
    ownerIcon: "person" | "groups";
    reason: string;
    trace: TestRoutingRowVm[];
    strategyLine: string;
    skipped: TestRoutingSkippedVm[];
}
