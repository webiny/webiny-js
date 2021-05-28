import plainObjectPath from "../../../../src/dynamoDb/path/plainObject";

describe("dynamodb path plain object", () => {
    it("should get the plain object path", () => {
        const plugin = plainObjectPath();

        const result = plugin.createPath({
            field: {
                fieldId: "authors",
                settings: {
                    path: "createdBy.id"
                }
            } as any
        });

        expect(result).toEqual("createdBy.id");
    });

    it("should throw an error when no path in the settings", () => {
        const plugin = plainObjectPath();

        expect(() => {
            plugin.createPath({
                field: {
                    settings: {}
                } as any
            });
        }).toThrow("Missing path settings value.");
    });
});
