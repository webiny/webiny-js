import { describe, expect, it } from "vitest";
import { cachedSystemPrompt, withEffort } from "./promptCaching.js";

describe("withEffort", () => {
    const cached = cachedSystemPrompt("system", "key");

    it("leaves the call as it was when no effort is set", () => {
        expect(withEffort(cached)).toBe(cached);
    });

    it("sets effort for each provider and keeps the cache options", () => {
        expect(withEffort(cached, "low").providerOptions).toEqual({
            anthropic: { effort: "low" },
            openai: { promptCacheKey: "key", reasoningEffort: "low" }
        });
        expect(withEffort(cached, "low").system).toBe(cached.system);
    });
});
