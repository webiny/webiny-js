// A keyboard move the list is waiting to see applied, to announce it and keep the focus (R313).
export interface RuleMoveRequest {
    ruleId: string;
    direction: "up" | "down";
}
