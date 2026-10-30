// Who a rule assigns to: a person or a reviewing team's pool.
export interface RuleTargetValue {
    type: "user" | "team";
    id: string;
}
