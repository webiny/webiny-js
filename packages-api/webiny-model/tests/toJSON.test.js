import { assert } from "chai";

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

describe("data extraction test", async function() {
    it("should correctly extract root values", async () => {
        const data = await user.toJSON("firstName,lastName,age");
        assert.equal(data.firstName, "John");
        assert.equal(data.lastName, "Doe");
        assert.equal(data.age, 15);
    });

    it("should correctly extract simple nested value", async () => {
        const data = await user.toJSON("company.image.file");
        assert.equal(data.company.image.file, "webiny.jpg");
    });

    it("should correctly extract nested values", async () => {
        const data = await user.toJSON(
            "firstName,lastName,age,company[name,city,image.size[height]]"
        );
        assert.deepEqual(data, {
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

    it("should correctly extract nested values", async () => {
        const data = await user.toJSON(
            "firstName,lastName,age,company[name,city,image.size[height]]"
        );
        assert.deepEqual(data, {
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

    it("when requesting attribute that is a model, its data should not be extracted", async () => {
        const data = await user.toJSON(
            "firstName,lastName,age,company[name,city,image.size.width]"
        );
        assert.deepEqual(data, {
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

    it("should return empty object if no path is specified", async () => {
        const data = await user.toJSON();
        assert.deepEqual(data, {});
    });
});
