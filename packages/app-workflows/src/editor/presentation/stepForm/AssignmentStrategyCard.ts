import type { AssignmentStrategy } from "~/editor/model/assignment/AssignmentStrategy.js";

// One radio card of the Strategy control (R297).
export interface AssignmentStrategyCard {
    // The stored strategy.
    value: AssignmentStrategy;
    name: string;
    description: string;
}
