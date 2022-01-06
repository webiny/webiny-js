import {
    Attributes,
    Attribute,
    createBooleanAttribute,
    BooleanAttribute,
    createDateTimeAttribute,
    DateTimeAttribute,
    createListAttribute,
    ListAttribute,
    createNumberAttribute,
    NumberAttribute,
    createObjectAttribute,
    ObjectAttribute,
    createStringAttribute,
    StringAttribute
} from "~/index";

describe("Attributes", () => {
    it("should construct Attributes object", () => {
        const attrs = new Attributes();

        expect(attrs).toBeInstanceOf(Attributes);
    });

    it("should construct Attributes object with attribute assigned", () => {
        const attrs = new Attributes([
            new Attribute({
                name: "id",
                type: "string"
            })
        ]);

        expect(attrs).toEqual({
            items: {
                id: {
                    name: "id",
                    type: "string"
                }
            }
        });

        expect(attrs.getAttributes()).toEqual({
            id: {
                name: "id",
                type: "string"
            }
        });
    });

    it("should not allow adding attribute with id that already exists", () => {
        const attrs = new Attributes([
            new Attribute({
                name: "id",
                type: "string"
            })
        ]);

        expect(() => {
            attrs.addAttribute({
                name: "id",
                type: "number"
            });
        }).toThrow(`Attribute "id" already exists.`);
    });

    it("should remove attribute", () => {
        const attrs = new Attributes();

        attrs.addAttributes([
            new Attribute({
                name: "id",
                type: "string"
            })
        ]);

        attrs.addAttribute(
            new Attribute({
                name: "version",
                type: "number"
            })
        );

        expect(attrs).toEqual({
            items: {
                id: {
                    name: "id",
                    type: "string"
                },
                version: {
                    name: "version",
                    type: "number"
                }
            }
        });

        attrs.removeAttribute("version");
        expect(attrs).toEqual({
            items: {
                id: {
                    name: "id",
                    type: "string"
                }
            }
        });
    });

    it("should do nothing when trying to remove non-existing attribute", () => {
        const attrs = new Attributes([
            new Attribute({
                name: "id",
                type: "string"
            })
        ]);

        attrs.removeAttribute("version");

        expect(attrs).toEqual({
            items: {
                id: {
                    name: "id",
                    type: "string"
                }
            }
        });
    });

    it("should return if has attribute", () => {
        const attrs = new Attributes([
            new Attribute({
                name: "id",
                type: "string"
            })
        ]);

        expect(attrs.hasAttribute("id")).toBeTruthy();
        expect(attrs.hasAttribute("version")).toBeFalsy();
    });

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
