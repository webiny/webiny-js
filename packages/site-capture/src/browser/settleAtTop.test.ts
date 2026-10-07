/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { settleAtTopScript } from "./stabilize.js";

const run = (quietMs: number, maxMs: number) =>
    new Function(`return ${settleAtTopScript(quietMs, maxMs)}`)() as Promise<{
        changes: number;
        waitedMs: number;
        quiet: boolean;
    }>;

// Modelled on G5's header: a scroll handler, debounced 250ms, that toggles body.stuck from scrollY.
describe("settleAtTopScript", () => {
    it("tells the page it scrolled, and waits for the debounced handler to finish", async () => {
        document.body.className = "stuck";
        let timer: ReturnType<typeof setTimeout> | undefined;
        const onScroll = () => {
            clearTimeout(timer);
            timer = setTimeout(
                () => document.body.classList.toggle("stuck", window.scrollY >= 500),
                250
            );
        };
        window.addEventListener("scroll", onScroll);
        try {
            const result = await run(400, 2500);
            expect(document.body.classList.contains("stuck")).toBe(false);
            expect(result.changes).toBeGreaterThan(0);
            expect(result.quiet).toBe(true);
        } finally {
            window.removeEventListener("scroll", onScroll);
        }
    });

    it("gives up at the bound on a page that never stops changing", async () => {
        const interval = setInterval(() => document.body.classList.toggle("tick"), 30);
        try {
            const result = await run(400, 600);
            expect(result.quiet).toBe(false);
            expect(result.waitedMs).toBeLessThan(900);
        } finally {
            clearInterval(interval);
        }
    });
});
