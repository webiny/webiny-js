import { describe, expect, it } from "vitest";
import { streamProgress } from "./GenerateRemoteComponentUseCase.js";

describe("streamProgress", () => {
    it("keeps what a cut-off answer had written, and when its chunks arrived", () => {
        let clock = 1_000;
        const progress = streamProgress(1_000, () => clock);
        clock = 1_800;
        progress.chunk("reasoning-delta", "thinking");
        clock = 2_000;
        progress.chunk("text-delta", "export const ");
        clock = 9_500;
        progress.chunk("text-delta", "Header = () => null;");

        expect(progress.partial()).toEqual({
            outputChars: 33,
            partialOutput: "export const Header = () => null;",
            stream: { firstChunkMs: 800, lastChunkMs: 8_500, chunks: 3, reasoningChars: 8 }
        });
    });

    it("reports no chunks for a call that produced nothing", () => {
        const progress = streamProgress(0, () => 300_000);
        expect(progress.partial()).toEqual({
            outputChars: 0,
            partialOutput: "",
            stream: { firstChunkMs: null, lastChunkMs: null, chunks: 0, reasoningChars: 0 }
        });
    });
});
