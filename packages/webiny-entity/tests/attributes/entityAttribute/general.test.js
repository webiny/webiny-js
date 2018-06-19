import { Entity, QueryResult } from "../../../src/index";
import { User, Company, Image } from "../../entities/userCompanyImage";
import { One } from "../../entities/oneTwoThree";
import sinon from "sinon";
import { UsersGroups } from "../../entities/entitiesUsing";

const sandbox = sinon.sandbox.create();

describe("entity attribute test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => User.getEntityPool().flush());

    test("should set root and nested values correctly", async () => {
        const user = new User();

        user.firstName = "John";
        user.lastName = "Doe";
        user.company = {
            name: "Company",
            image: {
                filename: "image.jpg",
                size: 123.45
            }
        };

        const company = await user.company;
        const image = await company.image;

        expect(user.firstName).toEqual("John");
        expect(user.lastName).toEqual("Doe");
        expect(company).toBeInstanceOf(Company);
        expect(await company.image).toBeInstanceOf(Image);
        expect(company.name).toEqual("Company");
        expect(image.filename).toEqual("image.jpg");
        expect(image.size).toEqual(123.45);

        image.filename = "image222.jpg";
        image.size = 234.56;

        expect(image.filename).toEqual("image222.jpg");
        expect(image.size).toEqual(234.56);
    });

    test("should populate values correctly", async () => {
        const user = new User();
        user.populate({
            firstName: "John",
            lastName: "Doe",
            company: {
                name: "Company",
                image: {
                    filename: "image.jpg",
                    size: 123.45
                }
            }
        });

        const company = await user.company;
        const image = await company.image;

        expect(user.firstName).toEqual("John");
        expect(user.lastName).toEqual("Doe");
        expect(company).toBeInstanceOf(Company);
        expect(image).toBeInstanceOf(Image);
        expect(company.name).toEqual("Company");
        expect(image.filename).toEqual("image.jpg");
        expect(image.size).toEqual(123.45);
    });

    test("should set entity only once using setter and populate methods", async () => {
        class Primary extends Entity {
            constructor() {
                super();
                this.attr("name")
                    .char()
                    .setValidators("required");
                this.attr("secondary")
                    .entity(Secondary)
                    .setOnce();
            }
        }

        class Secondary extends Entity {
            constructor() {
                super();
                this.attr("name")
                    .char()
                    .setValidators("required");
            }
        }

        const secondary1 = new Secondary();
        secondary1.name = "secondary1";

        const primary = new Primary();
        primary.name = "primary";
        primary.secondary = secondary1;

        expect(primary.name).toEqual("primary");

        let secondary = await primary.secondary;
        expect(secondary.name).toEqual("secondary1");

        const secondary2 = new Secondary();
        secondary2.name = "secondary2";

        primary.secondary = secondary2;

        secondary = await primary.secondary;
        expect(primary.name).toEqual("primary");
        expect(secondary.name).toEqual("secondary1");
    });

    test("should throw an exception", async () => {
        const mainEntity = new One();

        const entityPopulate = sandbox
            .stub(mainEntity.getAttribute("two").value, "setCurrent")
            .callsFake(() => {
                throw Error("Error was thrown.");
            });

        let error = null;
        try {
            await mainEntity.set("two", []);
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(Error);
        entityPopulate.restore();
    });

    test("should set entity only once using setter and populate methods", async () => {
        class Primary extends Entity {
            constructor() {
                super();
                this.attr("name")
                    .char()
                    .setValidators("required");
                this.attr("secondary")
                    .entity(Secondary)
                    .setOnce();
            }
        }

        class Secondary extends Entity {
            constructor() {
                super();
                this.attr("name")
                    .char()
                    .setValidators("required");
            }
        }

        const secondary1 = new Secondary();
        secondary1.name = "secondary1";

        const primary = new Primary();
        primary.name = "primary";
        primary.secondary = secondary1;

        let secondary = await primary.secondary;

        expect(primary.name).toEqual("primary");
        expect(secondary.name).toEqual("secondary1");

        const secondary2 = new Secondary();
        secondary2.name = "secondary2";

        primary.secondary = secondary2;

        secondary = await primary.secondary;
        expect(primary.name).toEqual("primary");
        expect(secondary.name).toEqual("secondary1");
    });

    test("must set entity to null", async () => {
        const entity = new User();
        entity.company = { name: "Test-1" };

        expect(await entity.company).toBeInstanceOf(Company);

        entity.company = null;
        expect(await entity.company).toBeNull();
    });

    test("should return null because no data was assigned", async () => {
        const entity = new User();
        expect(await entity.company).toBeNull();
    });

    test("should lazy load any of the accessed linked entities", async () => {
        let findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One", two: "two" });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "two", name: "Two", three: "three" });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({
                    id: "three",
                    name: "Three",
                    four: "four",
                    anotherFour: "anotherFour",
                    five: "five",
                    six: "six"
                });
            })
            .onCall(3)
            .callsFake(() => {
                return new QueryResult({ id: "four", name: "Four" });
            })
            .onCall(4)
            .callsFake(() => {
                return new QueryResult({ id: "anotherFour", name: "Another Four" });
            })
            .onCall(5)
            .callsFake(() => {
                return new QueryResult({ id: "five", name: "Five" });
            })
            .onCall(6)
            .callsFake(() => {
                return new QueryResult({ id: "six", name: "Six" });
            });

        const one = await One.findById("one");
        expect(one.id).toEqual("one");
        expect(one.name).toEqual("One");
        expect(one.getAttribute("two").value.getCurrent()).toEqual("two");

        const two = await one.two;
        expect(two.id).toEqual("two");
        expect(two.name).toEqual("Two");

        expect(two.getAttribute("three").value.getCurrent()).toEqual("three");

        const three = await two.three;
        expect(three.id).toEqual("three");
        expect(three.name).toEqual("Three");

        expect(three.getAttribute("four").value.getCurrent()).toEqual("four");

        const four = await three.four;
        expect(four.id).toEqual("four");
        expect(four.name).toEqual("Four");

        const anotherFour = await three.anotherFour;
        expect(anotherFour.id).toEqual("anotherFour");
        expect(anotherFour.name).toEqual("Another Four");

        const five = await three.five;
        expect(five.id).toEqual("five");
        expect(five.name).toEqual("Five");

        const six = await three.six;
        expect(six.id).toEqual("six");
        expect(six.name).toEqual("Six");

        findById.restore();
    });

    test("should set internal loaded flag to true when called for the first time, and no findById calls should be made", async () => {
        let findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One" });
            });

        const one = await One.findById("one");
        findById.restore();

        expect(one.getAttribute("two").value.getCurrent()).toEqual(null);
        expect(one.getAttribute("two").value.state).toEqual({ loaded: false, loading: false });

        findById = sandbox.spy(One.getDriver(), "findOne");
        one.two;
        one.two;
        await one.two;
        await one.two;

        expect(findById.callCount).toEqual(0);
        expect(one.getAttribute("two").value.getCurrent()).toEqual(null);
        expect(one.getAttribute("two").value.state).toEqual({ loaded: true, loading: false });

        await one.two;

        expect(findById.callCount).toEqual(0);
        expect(one.getAttribute("two").value.getCurrent()).toEqual(null);
        expect(one.getAttribute("two").value.state).toEqual({ loaded: true, loading: false });

        findById.restore();
    });

    test("should not load if values are already set", async () => {
        const mainEntity = new One();
        const entitySave = sandbox.spy(UsersGroups.getDriver(), "save");
        const entityFind = sandbox.spy(UsersGroups.getDriver(), "find");
        const entityFindById = sandbox.spy(UsersGroups.getDriver(), "findOne");

        await mainEntity.two;

        expect(entitySave.callCount).toBe(0);
        expect(entityFind.callCount).toBe(0);
        expect(entityFindById.callCount).toBe(0);

        await mainEntity.two;

        expect(entitySave.callCount).toBe(0);
        expect(entityFind.callCount).toBe(0);
        expect(entityFindById.callCount).toBe(0);

        entitySave.restore();
        entityFind.restore();
        entityFindById.restore();
    });

    test("getJSONValue method must return value - we don't do any processing toJSON on it", async () => {
        const user = new User();
        expect(await user.getAttribute("company").getJSONValue()).toBeNull();
    });
});
