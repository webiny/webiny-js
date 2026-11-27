import { describe, it, expect } from "vitest";
import { createApiNameSchema } from "./createApiNameSchema.js";

const schema = createApiNameSchema(() => []);

describe("createApiNameSchema reserved endings", () => {
    it.each(["Checklist", "Playlist"])(
        "accepts %s, which only ends with a lower case list",
        name => {
            expect(schema.safeParse(name).success).toBe(true);
        }
    );

    it.each(["ArticlesList", "FooRefType", "ArticleResponse", "ArticleMeta"])(
        "rejects %s",
        name => {
            expect(schema.safeParse(name).success).toBe(false);
        }
    );
});
