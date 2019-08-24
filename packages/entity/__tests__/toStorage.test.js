import User from "./entities/user";
import { Entity, Driver, EntityModel, EntityAttributesContainer } from "@webiny/entity";
import { Model, BooleanAttribute } from "@webiny/model";

describe("toStorage test", () => {
    test("should return the same values, except dynamic attribute", async () => {
        const user = new User();
        user.populate({
            firstName: "A",
            lastName: "B",
            age: 10,
            enabled: true
        });
        await user.validate();

        const data = await user.toStorage();

        expect(Object.keys(data)).toContainAllValues(["firstName", "lastName", "enabled", "age"]);
        expect(data["firstName"]).toBe("A");
        expect(data["lastName"]).toBe("B");
        expect(data["age"]).toBe(10);
        expect(data["enabled"]).toBe(true);
    });

    test("should return the same values, except dynamic attribute (including nested models)", async () => {
        class C extends Model {
            constructor() {
                super();
                this.attr("attr1").char();
                this.attr("attr2").char();
                this.attr("attr3")
                    .integer()
                    .setDynamic(() => {
                        return "attr3DynValue";
                    });
            }
        }

        class B extends Model {
            constructor() {
                super();
                this.attr("attr1").char();
                this.attr("attr2").char();
                this.attr("attr3")
                    .integer()
                    .setDynamic(() => {
                        return "attr3DynValue";
                    });

                this.attr("attr4").model(C);
                this.attr("attr5").models(C);
                this.attr("attr6")
                    .model(C)
                    .setDynamic(() => {
                        return "attr6DynValue";
                    });
                this.attr("attr7")
                    .models(C)
                    .setDynamic(() => {
                        return "attr7DynValue";
                    });
            }
        }

        class A extends Entity {
            constructor() {
                super();
                this.attr("attr1").char();
                this.attr("attr2").char();
                this.attr("attr3")
                    .integer()
                    .setDynamic(() => {
                        return "attr3DynValue";
                    });

                this.attr("attr4").model(B);
            }
        }

        const a = new A();
        a.populate({
            attr1: "attr1",
            attr2: "attr2",
            attr3: 333,
            attr4: {
                attr1: "attr1",
                attr2: "attr2",
                attr3: 333,
                attr4: {
                    attr1: "attr1",
                    attr2: "attr2",
                    attr3: 333
                },
                attr5: [
                    { attr1: "0.attr1", attr2: "0.attr2", attr3: 333 },
                    { attr1: "1.attr1", attr2: "1.attr2", attr3: 333 }
                ],
                attr6: {
                    attr1: "attr1",
                    attr2: "attr2",
                    attr3: 333
                },
                attr7: [
                    { attr1: "0.attr1", attr2: "0.attr2", attr3: 333 },
                    { attr1: "1.attr1", attr2: "1.attr2", attr3: 333 }
                ]
            }
        });

        const data = await a.toStorage();
        expect(data).toEqual({
            attr1: "attr1",
            attr2: "attr2",
            attr4: {
                attr1: "attr1",
                attr2: "attr2",
                attr4: { attr1: "attr1", attr2: "attr2" },
                attr5: [
                    { attr1: "0.attr1", attr2: "0.attr2" },
                    { attr1: "1.attr1", attr2: "1.attr2" }
                ]
            }
        });
    });

    test("should return 1 or 0 instead true or false respectively", async () => {
        class CustomBooleanAttribute extends BooleanAttribute {
            setStorageValue(value) {
                return this.setValue(!!value);
            }

            async getStorageValue() {
                return this.getValue() ? 1 : 0;
            }
        }

        class CustomAttributesContainer extends EntityAttributesContainer {
            boolean() {
                const model = this.getParentModel();
                model.setAttribute(this.name, new CustomBooleanAttribute(this.name, this));
                return model.getAttribute(this.name);
            }
        }

        class CustomDriverModel extends EntityModel {
            createAttributesContainer() {
                return new CustomAttributesContainer(this);
            }
        }

        class CustomDriver extends Driver {
            onEntityConstruct(entity) {
                entity.model = new CustomDriverModel();
            }
        }

        class CustomEntity extends Entity {
            constructor() {
                super();
                this.attr("firstName").char();
                this.attr("lastName").char();
                this.attr("age").integer();
                this.attr("enabled").boolean();
                this.attr("totalSomething")
                    .integer()
                    .setDynamic(() => 555);
            }
        }

        CustomEntity.driver = new CustomDriver();
        CustomEntity.classId = "customEntity";

        const customEntity1 = new CustomEntity();
        customEntity1.populate({
            firstName: "A",
            lastName: "B",
            age: 10,
            enabled: true
        });
        await customEntity1.validate();

        const data1 = await customEntity1.toStorage();

        expect(Object.keys(data1)).toContainAllValues(["firstName", "lastName", "enabled", "age"]);
        expect(data1["firstName"]).toBe("A");
        expect(data1["lastName"]).toBe("B");
        expect(data1["enabled"]).toBe(1);
        expect(data1["age"]).toBe(10);

        const customEntity2 = new CustomEntity();
        customEntity2.populate({
            firstName: "A",
            lastName: "B",
            age: 10,
            enabled: false
        });
        await customEntity2.validate();

        const data2 = await customEntity2.toStorage();

        expect(Object.keys(data2)).toContainAllValues(["firstName", "lastName", "enabled", "age"]);
        expect(data2["firstName"]).toBe("A");
        expect(data2["lastName"]).toBe("B");
        expect(data2["enabled"]).toBe(0);
        expect(data2["age"]).toBe(10);
    });
});
