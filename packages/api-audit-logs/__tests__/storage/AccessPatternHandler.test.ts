import { AccessPatternHandler } from "~/storage/AccessPatternHandler.js";
import { AppAccessPattern } from "~/storage/accessPatterns/AppAccessPattern.js";
import { AppAndActionAccessPattern } from "~/storage/accessPatterns/AppAndActionAccessPattern.js";

describe("AccessPatternHandler", () => {
    it("should throw an error if no patterns are provided", async () => {
        try {
            new AccessPatternHandler({
                patterns: []
            });
            throw new Error("Should have thrown an error.");
        } catch (ex) {
            expect(ex.message).toBe("At least one access pattern must be provided.");
            expect(ex.code).toBe("ACCESS_PATTERN_NOT_PROVIDED");
        }
    });

    it("should throw an error if no default pattern is provided", async () => {
        try {
            const handler = new AccessPatternHandler({
                patterns: [
                    new AppAccessPattern({
                        entity: {} as any,
                        index: "GSI1"
                    })
                ]
            });
            handler.getDefaultPattern();
            throw new Error("Should have thrown an error.");
        } catch (ex) {
            expect(ex.message).toBe("No default access pattern found.");
            expect(ex.code).toBe("DEFAULT_ACCESS_PATTERN_NOT_FOUND");
        }
    });

    it("should list access patterns", async () => {
        const handler = new AccessPatternHandler({
            patterns: [
                new AppAccessPattern({
                    entity: {} as any,
                    index: "GSI1"
                }),
                new AppAndActionAccessPattern({
                    entity: {} as any,
                    index: "GSI2"
                })
            ]
        });
        const patterns = handler.listIndexPatterns();
        expect(patterns).toHaveLength(2);
        expect(patterns[0].index).toBe("GSI1");
        expect(patterns[1].index).toBe("GSI2");
    });

    it("should fail to handle when no pattern matches", async () => {
        try {
            const handler = new AccessPatternHandler({
                patterns: [
                    new AppAccessPattern({
                        entity: {} as any,
                        index: "GSI1"
                    })
                ]
            });
            await handler.handle({
                createdBy: "123",
                limit: 20,
                tenant: "root"
            });
            throw new Error("Should have thrown an error.");
        } catch (ex) {
            expect(ex.message).toBe("No access pattern found for the given parameters.");
            expect(ex.code).toBe("ACCESS_PATTERN_NOT_FOUND");
        }
    });
});
