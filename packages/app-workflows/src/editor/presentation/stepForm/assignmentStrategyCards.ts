import type { AssignmentStrategyCard } from "./AssignmentStrategyCard.js";

// The strategy cards, in the design's order, with its names and descriptions (R297, `STRATS`).
export const ASSIGNMENT_STRATEGY_CARDS: AssignmentStrategyCard[] = [
    {
        value: "none",
        name: "None (team pool)",
        description: "The step waits in the team pool until a team member starts it."
    },
    {
        value: "roundRobin",
        name: "Round-robin",
        description: "Takes turns across eligible team members."
    },
    {
        value: "leastLoaded",
        name: "Least-loaded",
        description: "Picks the eligible member with the fewest open reviews."
    }
];
