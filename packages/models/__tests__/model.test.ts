import {
    createBooleanAttribute,
    createModel,
    createNumberAttribute,
    createStringAttribute,
    Model
} from "~/index";

describe("Model", () => {
    it("should construct model class with no attributes", () => {
        const model = new Model({
            name: "test"
        });

        expect(model).toBeInstanceOf(Model);
        expect(model).toEqual({
            name: "test",
            attributes: {
                items: {}
            }
        });
        expect(model.getAttributes()).toEqual({});
    });

    it("should construct model class with initial attributes and add new ones", () => {
        const model = new Model({
            name: "test",
            attributes: [
                createStringAttribute({
                    name: "id"
                })
            ]
        });
        expect(model).toEqual({
            name: "test",
            attributes: {
                items: {
                    id: {
                        name: "id",
                        type: "string"
                    }
                }
            }
        });
        model.addAttribute(
            createNumberAttribute({
                name: "version"
            })
        );
        expect(model).toEqual({
            name: "test",
            attributes: {
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
            }
        });
        model.addAttributes([
            createBooleanAttribute({
                name: "published"
            })
        ]);

        expect(model).toEqual({
            name: "test",
            attributes: {
                items: {
                    id: {
                        name: "id",
                        type: "string"
                    },
                    version: {
                        name: "version",
                        type: "number"
                    },
                    published: {
                        name: "published",
                        type: "boolean"
                    }
                }
            }
        });
        expect(model.getAttributes()).toEqual({
            id: {
                name: "id",
                type: "string"
            },
            version: {
                name: "version",
                type: "number"
            },
            published: {
                name: "published",
                type: "boolean"
            }
        });
    });

    it("it should remove attribute", () => {
        const valueAttribute = createStringAttribute({
            name: "value"
        });
        const model = new Model({
            name: "test",
            attributes: [
                createStringAttribute({
                    name: "id"
                }),
                valueAttribute
            ]
        });
        expect(model).toEqual({
            name: "test",
            attributes: {
                items: {
                    id: {
                        name: "id",
                        type: "string"
                    },
                    value: {
                        name: "value",
                        type: "string"
                    }
                }
            }
        });

        model.removeAttribute("id");
        expect(model).toEqual({
            name: "test",
            attributes: {
                items: {
                    value: {
                        name: "value",
                        type: "string"
                    }
                }
            }
        });

        model.removeAttribute(valueAttribute);
        expect(model).toEqual({
            name: "test",
            attributes: {
                items: {}
            }
        });
    });

    it("should create a model via factory", () => {
        const model = createModel({
            name: "test",
            attributes: [
                createStringAttribute({
                    name: "id"
                })
            ]
        });

        expect(model).toEqual({
            name: "test",
            attributes: {
                items: {
                    id: {
                        name: "id",
                        type: "string"
                    }
                }
            }
        });
    });
});
