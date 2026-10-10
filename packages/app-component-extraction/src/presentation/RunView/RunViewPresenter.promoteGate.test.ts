// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { RunViewPresenterImpl } from "./RunViewPresenter.js";
import type { RunDto } from "~/shared/types.js";

/*
 * The Promote gate lists what Generate produced, so it has something to show before Promote has output
 * — at the gate, and while Promote runs. Loading it only once Promote was done showed "No components
 * are eligible" over sixteen accepted components for the length of a Promote.
 */
const run = (promote: string): RunDto =>
    ({
        id: "r",
        jobId: "j",
        stages: [
            { stage: "generate", status: "done", taskId: "g" },
            { stage: "promote", status: promote, taskId: promote === "pending" ? null : "p" }
        ]
    }) as unknown as RunDto;

const presenterFor = () => {
    const component = { signature: "s1", name: "Footer" };
    const gateway = {
        getStageArtifact: vi.fn(async (_runId: string, stage: string) =>
            stage === "generate" ? { components: [component] } : null
        ),
        listLibraryNames: vi.fn(async () => []),
        getDecisions: vi.fn(async () => ({ decisions: { s1: "accepted" } })),
        listOverrides: vi.fn(async () => [])
    };
    const presenter = new RunViewPresenterImpl(gateway as never);
    const load = (r: RunDto) =>
        (
            presenter as unknown as { loadArtifact(r: RunDto, stage: string): Promise<void> }
        ).loadArtifact(r, "promote");
    return { presenter, gateway, load };
};

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

describe("Promote gate", () => {
    it.each(["pending", "running"])(
        "loads Generate's components while Promote is %s",
        async status => {
            const { presenter, load } = presenterFor();
            expect(presenter.vm.promoteGateLoaded).toBe(false);

            await load(run(status));
            await settle();

            expect(presenter.vm.promoteGateLoaded).toBe(true);
            expect(presenter.vm.promoteComponents.map(c => c.signature)).toEqual(["s1"]);
            expect(presenter.vm.decisions).toEqual({ s1: "accepted" });
        }
    );

    it("reports loaded with nothing, when Generate's artifact cannot be read", async () => {
        const { presenter, gateway, load } = presenterFor();
        gateway.getStageArtifact.mockRejectedValue(new Error("unreadable"));

        await load(run("running"));
        await settle();

        expect(presenter.vm.promoteGateLoaded).toBe(true);
        expect(presenter.vm.promoteComponents).toEqual([]);
    });
});
