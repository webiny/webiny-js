import { Attributes, Attribute } from "~/index";

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
});
