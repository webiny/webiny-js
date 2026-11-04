import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { buildTestRoutingVm } from "./buildTestRoutingVm.js";
import { createTestRoutingState } from "./TestRoutingState.js";
import { getTestRoutingFailureMessage } from "./getTestRoutingFailureMessage.js";

describe("buildTestRoutingVm (R300, Q59.2)", () => {
    it("cannot run without a requester and says why", () => {
        const vm = buildTestRoutingVm({ state: createTestRoutingState(), currentSignature: "a" });

        expect(vm).toEqual({
            requesterId: null,
            folderId: null,
            canRun: false,
            hint: "Choose a requester to test.",
            buttonLabel: "Test routing",
            status: "idle",
            stale: false,
            result: null,
            errorMessage: null
        });
    });

    it("can run with a requester and shows no hint", () => {
        const vm = buildTestRoutingVm({
            state: { ...createTestRoutingState(), requesterId: "user-1", folderId: "f-1" },
            currentSignature: "a"
        });

        expect(vm.canRun).toBe(true);
        expect(vm.hint).toBeNull();
        expect(vm.requesterId).toBe("user-1");
        expect(vm.folderId).toBe("f-1");
    });

    it("shows Testing… and cannot run again while running", () => {
        const vm = buildTestRoutingVm({
            state: { ...createTestRoutingState(), requesterId: "user-1", status: "running" },
            currentSignature: "a"
        });

        expect(vm.buttonLabel).toBe("Testing…");
        expect(vm.canRun).toBe(false);
        expect(vm.status).toBe("running");
        expect(vm.result).toBeNull();
    });

    it("marks a done result stale when the signature differs, and keeps the result", () => {
        const result = {
            ownerLabel: "Team pool",
            ownerIcon: "groups" as const,
            reason: "No rule matched; waits in the team pool.",
            trace: [],
            strategyLine: "None: the step waits in the team pool.",
            skipped: []
        };
        const state = {
            ...createTestRoutingState(),
            requesterId: "user-1",
            status: "done" as const,
            result,
            signature: "a"
        };

        expect(buildTestRoutingVm({ state, currentSignature: "a" }).stale).toBe(false);
        const stale = buildTestRoutingVm({ state, currentSignature: "b" });
        expect(stale.stale).toBe(true);
        expect(stale.result).toBe(result);
    });

    it("shows the error of a failed run and no result", () => {
        const vm = buildTestRoutingVm({
            state: {
                ...createTestRoutingState(),
                requesterId: "user-1",
                status: "failed",
                errorMessage: "Could not test routing: the server did not respond.",
                signature: "a"
            },
            currentSignature: "b"
        });

        expect(vm.errorMessage).toBe("Could not test routing: the server did not respond.");
        expect(vm.result).toBeNull();
        expect(vm.stale).toBe(false);
        expect(vm.canRun).toBe(true);
    });
});

describe("getTestRoutingFailureMessage (R300, R306, Q59.3)", () => {
    it("shows the server message of a Validation error", () => {
        const error = new GraphQLOperationError({
            code: WorkflowErrorCode.Validation,
            message: "Choose who this rule assigns to.",
            data: null
        });

        expect(getTestRoutingFailureMessage(error)).toBe(
            "Could not test routing: Choose who this rule assigns to."
        );
    });

    it("shows the transport text for a transport failure and any other server error", () => {
        const transport = getTestRoutingFailureMessage(new Error("down"));
        const denied = getTestRoutingFailureMessage(
            new GraphQLOperationError({
                code: WorkflowErrorCode.NotAuthorized,
                message: "No.",
                data: null
            })
        );

        expect(transport).toBe("Could not test routing: the server did not respond.");
        expect(denied).toBe("Could not test routing: the server did not respond.");
    });
});
