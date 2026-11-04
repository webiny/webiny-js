import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createRuleId } from "./createRuleId.js";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("createRuleId (R294)", () => {
    it("is an r followed by 12 lowercase alphanumeric characters", () => {
        for (let index = 0; index < 50; index++) {
            expect(createRuleId([])).toMatch(/^r[a-z0-9]{12}$/);
        }
    });

    it("is unique across a growing list of existing ids", () => {
        const ids: string[] = [];
        for (let index = 0; index < 200; index++) {
            ids.push(createRuleId(ids));
        }

        expect(new Set(ids).size).toBe(200);
    });

    it("retries when the first candidate is already taken", () => {
        const random = vi.spyOn(Math, "random");
        // The first candidate is twelve times the first character (`raaaaaaaaaaaa`), the second twelve times the character at 0.5.
        for (let index = 0; index < 12; index++) {
            random.mockReturnValueOnce(0);
        }
        random.mockReturnValue(0.5);

        const id = createRuleId(["raaaaaaaaaaaa"]);

        expect(id).toBe("rssssssssssss");
    });
});
