import {
    Attribute,
    BooleanAttribute,
    createBooleanAttribute,
    createDateTimeAttribute,
    createListAttribute,
    createNumberAttribute,
    createObjectAttribute,
    createStringAttribute,
    DateTimeAttribute,
    ListAttribute,
    NumberAttribute,
    ObjectAttribute,
    StringAttribute
} from "~/index";

describe("factories", () => {
    it("should construct boolean attribute", () => {
        const result = createBooleanAttribute({
            name: "id"
        });

        expect(result).toBeInstanceOf(Attribute);
        expect(result).toBeInstanceOf(BooleanAttribute);
        expect(result).toEqual({
            name: "id",
            type: "boolean"
        });
    });

    it("should construct dateTime attribute", () => {
        const result = createDateTimeAttribute({
            name: "id"
        });

        expect(result).toBeInstanceOf(Attribute);
        expect(result).toBeInstanceOf(DateTimeAttribute);
        expect(result).toEqual({
            name: "id",
            type: "datetime"
        });
    });

    it("should construct list attribute", () => {
        const result = createListAttribute({
            name: "id"
        });

        expect(result).toBeInstanceOf(Attribute);
        expect(result).toBeInstanceOf(ListAttribute);
        expect(result).toEqual({
            name: "id",
            type: "list"
        });
    });

    it("should construct number attribute", () => {
        const result = createNumberAttribute({
            name: "id"
        });

        expect(result).toBeInstanceOf(Attribute);
        expect(result).toBeInstanceOf(NumberAttribute);
        expect(result).toEqual({
            name: "id",
            type: "number"
        });
    });

    it("should construct object attribute", () => {
        const result = createObjectAttribute({
            name: "id"
        });

        expect(result).toBeInstanceOf(ObjectAttribute);
        expect(result).toEqual({
            name: "id",
            type: "object"
        });
    });

    it("should construct string attribute", () => {
        const result = createStringAttribute({
            name: "id"
        });

        expect(result).toBeInstanceOf(Attribute);
        expect(result).toBeInstanceOf(StringAttribute);
        expect(result).toEqual({
            name: "id",
            type: "string"
        });
    });
});
