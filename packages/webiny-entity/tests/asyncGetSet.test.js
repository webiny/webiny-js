import { User, Image } from "./entities/userCompanyImage";
import sinon from "sinon";
import { QueryResult } from "webiny-entity";

const sandbox = sinon.sandbox.create();

describe("async get and set methods test", async () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => User.getEntityPool().flush());

    test("should be able to get simple attributes", async () => {
        const user = new User();
        await user.set("firstName", "John");
        await user.set("lastName", "Doe");

        expect(await user.get("firstName")).toEqual("John");
        expect(await user.get("lastName")).toEqual("Doe");
    });

    test("should be able to get simple attributes", async () => {
        const user = new User();
        await user.set("firstName", "John");
        await user.set("lastName", "Doe");

        expect(await user.get("firstName")).toEqual("John");
        expect(await user.get("lastName")).toEqual("Doe");
    });

    test("should return empty object if path not set", async () => {
        const user = new User();
        await user.set("firstName", "John");
        await user.set("lastName", "Doe");

        expect(await user.get()).not.toBeDefined();
    });

    test("should return default value properly", async () => {
        const user = new User();
        await user.set("firstName", "John");
        await user.set("lastName", "Doe");

        expect(await user.get("firstName", "Test")).toEqual("John");
        expect(await user.get("firstName1")).not.toBeDefined();
        expect(await user.get("firstName1", "Test")).toEqual("Test");
    });

    test("should be able to get values from nested entities", async () => {
        const findById = sandbox
            .stub(User.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({
                    id: "A",
                    firstName: "John",
                    lastName: "Doe",
                    company: "B"
                });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "B", name: "TestCompany", image: "C" });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({
                    id: "C",
                    size: 12,
                    markedAsCannotDelete: true,
                    filename: "test.jpg",
                    createdBy: "A"
                });
            });

        const user = await User.findById("A");

        const image = await user.get("company.image");

        expect(findById.callCount).toEqual(3);
        findById.restore();

        expect(image).toBeInstanceOf(Image);

        expect(await user.get("company.image.id")).toEqual("C");
        expect(await user.get("company.image.filename")).toEqual("test.jpg");
        expect(await image.getAttribute("createdBy").value.getCurrent()).toEqual("A");
    });

    test("should be able to directly set values into nested entities", async () => {
        const findById = sandbox
            .stub(User.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({
                    id: "A",
                    firstName: "John",
                    lastName: "Doe",
                    company: "B"
                });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "B", name: "TestCompany", image: "C" });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({
                    id: "C",
                    size: 12,
                    markedAsCannotDelete: true,
                    filename: "test.jpg",
                    createdBy: "A"
                });
            });

        const user = await User.findById("A");

        await user.set("company.name", "Test");
        expect(await user.get("company.name")).toEqual("Test");

        expect((await user.get("company")).getAttribute("image").value.getCurrent()).toEqual("C");

        await user.set("company.image.filename", "another.test.jpg");
        expect(await user.get("company.image")).toBeInstanceOf(Image);
        expect(await user.get("company.image.filename")).toEqual("another.test.jpg");

        expect(findById.calledThrice).toBeTruthy();
        findById.restore();
    });

    test(`should read from objects too, not only attributes`, async () => {
        const user = new User().populate({
            company: {
                city: "New York"
            }
        });
        await user.company;

        user.getAttribute("company")
            .value.current.getAttribute("name")
            .onGet(() => {
                return { one: "one", two: { three: "finalValue" } };
            });

        expect(await user.get("company.name.two.three")).toEqual("finalValue");
    });

    test(`should return default value when keys on objects (not attributes) are not set`, async () => {
        const user = new User().populate({ company: {} });
        await user.company;

        user.getAttribute("company")
            .value.current.getAttribute("name")
            .onGet(() => {
                return { one: "one", two: { three: "finalValue" } };
            });

        expect(await user.get("company.name.two.three", "defaultValue")).toEqual("finalValue");
        expect(await user.get("company.name.two.three.four", "defaultValue")).toEqual(
            "defaultValue"
        );
        expect(await user.get("company.name.two.three.four.five", "defaultValue")).toEqual(
            "defaultValue"
        );
    });
});
