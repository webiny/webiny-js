import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapRoutingInspection } from "./mapRoutingInspection.js";
import type { RoutingInspectionDto } from "./dto.js";
import { createRoutingInspection } from "~/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "~/editor/testing/editorFixtures.js";

describe("mapRoutingInspection", () => {
    it("maps every field of a rule decision", () => {
        const dto = createRoutingInspectionDto({
            owner: { id: "user-2", displayName: "Ivan Horvat" },
            source: "rule",
            ruleId: "rule-2",
            strategy: "none",
            trace: [
                {
                    ruleId: "rule-1",
                    outcome: "notMatched",
                    reason: null,
                    failedConditions: ["requesterTeam"]
                },
                { ruleId: "rule-2", outcome: "matched", reason: null, failedConditions: [] }
            ]
        });

        const result = mapRoutingInspection(dto);

        expect(result).toEqual(
            createRoutingInspection({
                owner: { id: "user-2", displayName: "Ivan Horvat" },
                source: "rule",
                ruleId: "rule-2",
                strategy: "none",
                trace: [
                    {
                        ruleId: "rule-1",
                        outcome: "notMatched",
                        reason: null,
                        failedConditions: ["requesterTeam"]
                    },
                    { ruleId: "rule-2", outcome: "matched", reason: null, failedConditions: [] }
                ]
            })
        );
    });

    it("maps every trace outcome, the failed conditions and the reasons", () => {
        const dto = createRoutingInspectionDto({
            trace: [
                {
                    ruleId: "rule-1",
                    outcome: "notMatched",
                    reason: null,
                    failedConditions: ["requesterUser", "folder"]
                },
                {
                    ruleId: "rule-2",
                    outcome: "skipped",
                    reason: "Excluded from reviews.",
                    failedConditions: []
                },
                { ruleId: "rule-3", outcome: "matched", reason: null, failedConditions: [] },
                { ruleId: "rule-4", outcome: "notEvaluated", reason: null, failedConditions: [] }
            ]
        });

        const trace = mapRoutingInspection(dto).trace;

        expect(trace.map(entry => entry.outcome)).toEqual([
            "notMatched",
            "skipped",
            "matched",
            "notEvaluated"
        ]);
        expect(trace[0].failedConditions).toEqual(["requesterUser", "folder"]);
        expect(trace[1].reason).toBe("Excluded from reviews.");
        expect(trace[3].reason).toBeNull();
    });

    it("keeps the order of the trace as the server returned it", () => {
        const dto = createRoutingInspectionDto({
            trace: [
                { ruleId: "rule-b", outcome: "matched", reason: null, failedConditions: [] },
                { ruleId: "rule-a", outcome: "notEvaluated", reason: null, failedConditions: [] }
            ]
        });

        const ids = mapRoutingInspection(dto).trace.map(entry => entry.ruleId);

        expect(ids).toEqual(["rule-b", "rule-a"]);
    });

    it("maps a pool decision without an owner", () => {
        const dto = createRoutingInspectionDto({
            owner: null,
            source: "pool",
            ruleId: null,
            trace: []
        });

        const result = mapRoutingInspection(dto);

        expect(result.owner).toBeNull();
        expect(result.source).toBe("pool");
        expect(result.ruleId).toBeNull();
        expect(result.trace).toEqual([]);
    });

    it("maps the narrowed team, the first candidate ids and the candidate count", () => {
        const dto = createRoutingInspectionDto({
            owner: { id: "user-3", displayName: "Maja Kos" },
            source: "roundRobin",
            ruleId: "rule-1",
            strategy: "roundRobin",
            narrowedTeamId: "team-2",
            candidateIds: ["user-3", "user-4", "user-5"],
            candidateCount: 7
        });

        const result = mapRoutingInspection(dto);

        expect(result.narrowedTeamId).toBe("team-2");
        expect(result.candidateIds).toEqual(["user-3", "user-4", "user-5"]);
        expect(result.candidateCount).toBe(7);
        expect(result.strategy).toBe("roundRobin");
        expect(result.source).toBe("roundRobin");
    });

    it("maps the skipped people, a null display name stays null", () => {
        const dto = createRoutingInspectionDto({
            skipped: [
                { userId: "user-6", displayName: "Luka Peric", reason: "Excluded from reviews." },
                { userId: "user-7", displayName: null, reason: "Can't read this content." }
            ]
        });

        expect(mapRoutingInspection(dto).skipped).toEqual([
            { userId: "user-6", displayName: "Luka Peric", reason: "Excluded from reviews." },
            { userId: "user-7", displayName: null, reason: "Can't read this content." }
        ]);
    });

    it("maps each configured strategy and an unknown string to none", () => {
        const roundRobinDto = createRoutingInspectionDto({ strategy: "roundRobin" });
        const leastLoadedDto = createRoutingInspectionDto({ strategy: "leastLoaded" });
        const noneDto = createRoutingInspectionDto({ strategy: "none" });
        const unknownDto = createRoutingInspectionDto({ strategy: "somethingNew" });

        const roundRobin = mapRoutingInspection(roundRobinDto);
        const leastLoaded = mapRoutingInspection(leastLoadedDto);
        const none = mapRoutingInspection(noneDto);
        const unknown = mapRoutingInspection(unknownDto);

        expect(roundRobin.strategy).toBe("roundRobin");
        expect(leastLoaded.strategy).toBe("leastLoaded");
        expect(none.strategy).toBe("none");
        expect(unknown.strategy).toBe("none");
    });

    it("maps absent optional fields to their empty values", () => {
        const dto = createRoutingInspectionDto();
        Reflect.deleteProperty(dto, "narrowedTeamId");
        Reflect.deleteProperty(dto, "candidateIds");
        Reflect.deleteProperty(dto, "candidateCount");
        const entry = dto.trace[0];
        Reflect.deleteProperty(entry, "failedConditions");
        Reflect.deleteProperty(entry, "reason");

        const result = mapRoutingInspection(dto);

        expect(result.narrowedTeamId).toBeNull();
        expect(result.candidateIds).toEqual([]);
        expect(result.candidateCount).toBe(0);
        expect(result.trace[0].failedConditions).toEqual([]);
        expect(result.trace[0].reason).toBeNull();
    });

    it("does not share its arrays with the DTO", () => {
        const dto: RoutingInspectionDto = createRoutingInspectionDto({
            candidateIds: ["user-3"],
            candidateCount: 1,
            trace: [
                {
                    ruleId: "rule-1",
                    outcome: "notMatched",
                    reason: null,
                    failedConditions: ["folder"]
                }
            ],
            skipped: [{ userId: "user-6", displayName: null, reason: "Excluded from reviews." }]
        });

        const result = mapRoutingInspection(dto);

        expect(result.candidateIds).not.toBe(dto.candidateIds);
        expect(result.trace).not.toBe(dto.trace);
        expect(result.trace[0].failedConditions).not.toBe(dto.trace[0].failedConditions);
        expect(result.skipped).not.toBe(dto.skipped);
    });
});
