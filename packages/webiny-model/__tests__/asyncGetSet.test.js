import { User, Size } from "./models/userModels";
import { Model } from "webiny-model";

const user = new User();
user.populate({
    firstName: "John",
    lastName: "Doe",
    age: 15,
    company: {
        name: "Webiny LTD",
        city: "London",
        image: {
            file: "webiny.jpg",
            size: { width: 12.5, height: 44 },
            visible: false
        }
    }
});

describe("async get and set methods test", async () => {
    test("should correctly return simple values", async () => {
        expect(await user.get("firstName")).toEqual("John");
        expect(await user.get("lastName")).toEqual("Doe");
        expect(await user.get("age")).toEqual(15);
    });

    test("should correctly return nested values", async () => {
        expect(await user.get("company.name")).toEqual("Webiny LTD");
        expect(await user.get("company.city")).toEqual("London");
        expect(await user.get("company.image.size")).toBeInstanceOf(Size);
        expect(await user.get("company.image.size.width")).toEqual(12.5);
        expect(await user.get("company.image.size.height")).toEqual(44);
        expect(await user.get("company.image.visible")).toBe(false);
    });

    test("should return undefined", async () => {
        expect(await user.get("name2")).not.toBeDefined();
        expect(await user.get("company.name2")).not.toBeDefined();
        expect(await user.get("company.image.size.")).not.toBeDefined();
        expect(await user.get("company.image.size.__")).not.toBeDefined();
        expect(await user.get("company.image.size.width ")).not.toBeDefined();
    });

    test("should return instance of model", async () => {
        expect(await user.get()).not.toBeDefined();
    });

    test("should correctly set simple values", async () => {
        await user.set("firstName", "Jane");
        await user.set("lastName", "Smith");
        await user.set("age", 30);

        expect(await user.get("firstName")).toEqual("Jane");
        expect(await user.get("lastName")).toEqual("Smith");
        expect(await user.get("age")).toEqual(30);
    });

    test("should not set anything if key is invalid", async () => {
        const newUser = new User();
        await newUser.set("firstName12", "Jane");
        await newUser.set("company", {});
        await newUser.set("company.name123", "Facebook");
        await newUser.set("compa.name123", "Facebook");

        expect(newUser.firstName).toBeNull();
        expect(newUser.firstName12).not.toBeDefined();
        expect(newUser.company.name).toBeNull();
        expect(newUser.company.name123).not.toBeDefined();
    });

    test("should correctly return nested values", async () => {
        await user.set("company.name", "Facebook");
        await user.set("company.city", "San Francisco");
        expect(await user.get("company.name")).toEqual("Facebook");
        expect(await user.get("company.city")).toEqual("San Francisco");

        await user.set("company.image.size", { width: 50, height: 100 });
        expect(await user.get("company.image.size")).toBeInstanceOf(Size);
        expect(await user.get("company.image.size.width")).toEqual(50);
        expect(await user.get("company.image.size.height")).toEqual(100);

        await user.set("company.image.size.width", 100);
        await user.set("company.image.size.height", 200);

        expect(await user.get("company.image.size")).toBeInstanceOf(Size);
        expect(await user.get("company.image.size.width")).toEqual(100);
        expect(await user.get("company.image.size.height")).toEqual(200);

        await user.set("company.image.visible", true);
        expect(await user.get("company.image.visible")).toBe(true);
    });

    test("should not set anything since path is invalid", async () => {
        await user.set("name2", 111);
    });

    test("should be able to directly set/get values in arrays", async () => {
        class Pet extends Model {
            constructor() {
                super();
                this.attr("name").char();
                this.attr("enabled").boolean();
            }
        }

        class User extends Model {
            constructor() {
                super();
                this.attr("name").char();
                this.attr("pets").models(Pet);
            }
        }

        const user = new User();
        user.name = "John";
        user.pets = [
            { name: "Enlai", enabled: false },
            { name: "Lina", enabled: false },
            { name: "Bucky", enabled: false }
        ];

        expect(await user.get("pets.0.name")).toEqual("Enlai");
        expect(await user.get("pets.1.name")).toEqual("Lina");
        expect(await user.get("pets.2.name")).toEqual("Bucky");

        await user.set("pets.0.name", "Enlai_UPDATED");
        await user.set("pets.1.name", "Lina_UPDATED");
        await user.set("pets.2.name", "Bucky_UPDATED");

        expect(await user.get("pets.0.name")).toEqual("Enlai_UPDATED");
        expect(await user.get("pets.1.name")).toEqual("Lina_UPDATED");
        expect(await user.get("pets.2.name")).toEqual("Bucky_UPDATED");
    });

    test("should return undefined if path does not exist", async () => {
        const user = new User();
        user.populate({
            company: {
                name: "Webiny LTD",
                city: "London",
                image: {
                    file: "webiny.jpg",
                    size: { width: 12.5, height: 44 },
                    visible: false
                }
            }
        });

        expect(await user.get("company.image.file.size.width")).not.toBeDefined();
    });

    test(`should accept additional ":" arguments on root keys`, async () => {
        const user = new User().populate({ id: "A", age: 30 });

        expect(await user.get("age")).toEqual(30);
        expect(await user.get("age:add:100")).toEqual(130);
        expect(await user.get("age:sub:20")).toEqual(10);
    });

    test(`should accept additional ":" arguments on nested keys`, async () => {
        const user = new User().populate({
            company: {
                city: "New York"
            }
        });

        expect(await user.get("company.city")).toEqual("New York");
        expect(await user.get("company.city:true")).toEqual("new york");
    });
});
