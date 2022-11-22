import { createPlainObjectPathPlugin } from "~/dynamoDb/path/plainObject";

describe("dynamodb path plain object", () => {
    it("should get the plain object path", () => {
        const plugin = createPlainObjectPathPlugin();

        const result = plugin.createPath({
            field: {
                storageId: "authors",
                settings: {
                    path: "createdBy.id"
                }
            } as any
        });

        expect(result).toEqual("createdBy.id");
    });

    it("should throw an error when no path in the settings", () => {
        const plugin = createPlainObjectPathPlugin();

        expect(() => {
            plugin.createPath({
                field: {
                    settings: {}
                } as any
            });
        }).toThrow("Missing path settings value.");
    });
});
