import { User } from "./models/userModels";

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

describe("data extraction test", async () => {
    test("should correctly extract root values", async () => {
        const data = await user.toJSON("firstName,lastName,age");
        expect(data.firstName).toEqual("John");
        expect(data.lastName).toEqual("Doe");
        expect(data.age).toEqual(15);
    });

    test("should correctly extract simple nested value", async () => {
        const data = await user.toJSON("company.image.file");
        expect(data.company.image.file).toEqual("webiny.jpg");
    });

    test("should correctly extract nested values", async () => {
        const data = await user.toJSON(
            "firstName,lastName,age,company[name,city,image.size[height]]"
        );
        expect(data).toEqual({
            firstName: "John",
            lastName: "Doe",
            age: 15,
            company: {
                name: "Webiny LTD",
                city: "London",
                image: {
                    size: {
                        height: 44
                    }
                }
            }
        });
    });

    test("should correctly extract nested values", async () => {
        const data = await user.toJSON(
            "firstName,lastName,age,company[name,city,image.size[height]]"
        );
        expect(data).toEqual({
            firstName: "John",
            lastName: "Doe",
            age: 15,
            company: {
                name: "Webiny LTD",
                city: "London",
                image: {
                    size: {
                        height: 44
                    }
                }
            }
        });
    });

    test("when requesting attribute that is a model, its data should not be extracted", async () => {
        const data = await user.toJSON(
            "firstName,lastName,age,company[name,city,image.size.width]"
        );
        expect(data).toEqual({
            firstName: "John",
            lastName: "Doe",
            age: 15,
            company: {
                name: "Webiny LTD",
                city: "London",
                image: {
                    size: {
                        width: 12.5
                    }
                }
            }
        });
    });

    test("should return empty object if no path is specified", async () => {
        const data = await user.toJSON();
        expect(data).toEqual({});
    });

    test("should not return fields that does not exist", async () => {
        const user = new User().populate({ id: "A", age: 30 });
        const extract = await user.toJSON("age,username");
        expect(extract).toEqual({ age: 30 });
    });

    test(`should accept additional ":" arguments on root keys`, async () => {
        const user = new User().populate({ id: "A", age: 30 });

        let extract = await user.toJSON("age");
        expect(extract).toEqual({ age: 30 });

        extract = await user.toJSON("age:add:100");
        expect(extract).toEqual({ age: 130 });

        extract = await user.toJSON("age:sub:20");
        expect(extract).toEqual({ age: 10 });
    });

    test(`should accept additional ":" arguments on nested keys`, async () => {
        const user = new User().populate({
            company: {
                city: "New York"
            }
        });

        let extract = await user.toJSON("company.city");
        expect(extract).toEqual({
            company: {
                city: "New York"
            }
        });

        extract = await user.toJSON("company.city:true");
        expect(extract).toEqual({
            company: {
                city: "new york"
            }
        });
    });

    test(`should read from objects too, not only attributes`, async () => {
        const user = new User().populate({
            company: {
                city: "New York"
            }
        });

        user.getAttribute("company")
            .value.current.getAttribute("city")
            .onGet(() => {
                return { one: "one", two: { three: "finalValue" } };
            });

        let extract = await user.toJSON("company.city.two.three");
        expect(extract).toEqual({
            company: {
                city: {
                    two: {
                        three: "finalValue"
                    }
                }
            }
        });
    });
});
