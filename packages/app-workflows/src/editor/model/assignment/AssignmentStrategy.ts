// The stored `assignment.strategy` of a People step (R297); Task 9 reads and writes it.
export type AssignmentStrategy = "none" | "roundRobin" | "leastLoaded";

// Every strategy the server stores (`reviewStepConfigSchema`), in the order the editor offers them as radio cards.
export const ASSIGNMENT_STRATEGIES: AssignmentStrategy[] = ["none", "roundRobin", "leastLoaded"];
