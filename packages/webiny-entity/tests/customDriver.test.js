import { Entity, Driver, EntityModel, QueryResult } from "./../src";
import _ from "lodash";

class CustomDriver extends Driver {
    constructor() {
        super();
        this.data = {};
    }

    getModelClass() {
        return EntityModel;
    }

    async save(entity, params) {
        const isUpdate = entity.id;
        if (!isUpdate) {
            entity.id = Math.random()
                .toString(36)
                .substring(2);
        }

        await entity.validate();

        // Check if table exists.
        if (!this.data[entity.classId]) {
            this.data[entity.classId] = {};
        }

        this.data[entity.classId][entity.id] = await entity.toStorage();
    }

    async delete(entity, params) {
        if (!this.data[entity.classId]) {
            return;
        }

        if (!this.data[entity.classId][entity.id]) {
            return;
        }

        delete this.data[entity.classId][entity.id];
    }

    async count(entity, params) {
        const results = await this.find(entity, params);
        return new QueryResult(results.getResult().length);
    }

    async findOne(entity, params) {
        return new QueryResult(_.find(this.data[entity.classId], params.query));
    }

    async find(entity, params) {
        const records = this.data[entity.classId];
        if (!records) {
            return new QueryResult([]);
        }

        const collection = [];

        recordsLoop: for (const [id, record] of Object.entries(this.data[entity.classId])) {
            for (const [key, value] of Object.entries(_.get(params, "query", {}))) {
                if (record[key] !== value) {
                    continue recordsLoop;
                }
            }
            collection.push(record);
        }

        return new QueryResult(collection);
    }
}

class CustomEntity extends Entity {}

CustomEntity.driver = new CustomDriver();
CustomEntity.classId = "customEntity";

class User extends CustomEntity {
    constructor() {
        super();
        this.attr("firstName")
            .char()
            .setValidators("required");
        this.attr("lastName")
            .char()
            .setValidators("required");
        this.attr("age").integer();
        this.attr("enabled")
            .boolean()
            .setDefaultValue(true);
    }
}

describe("custom driver test", () => {
    test("should have CustomDriver set as driver driver", async () => {
        const user = new User();
        expect(user.driver).toBeInstanceOf(CustomDriver);
    });

    test("should save entities and then find them", async () => {
        const user1 = new User();
        user1.populate({ firstName: "John", lastName: "Doe", age: 30 });
        await user1.save();

        const user2 = new User();
        user2.populate({ firstName: "Jane", lastName: "Doe", age: 25 });
        await user2.save();

        const user3 = new User();
        user3.populate({ firstName: "Foo", lastName: "Bar", age: 100, enabled: false });
        await user3.save();

        const aa = User.getDriver();
        const users = await User.find();
        expect(users.length).toBe(3);
        const usa = [users[0], users[0].age];
        expect(users[0].age).toEqual(30);
        expect(users[1].age).toEqual(25);
        expect(users[2].age).toEqual(100);
    });

    test("should return only one user", async () => {
        const user1 = new User();
        user1.populate({ firstName: "John", lastName: "Doe", age: 250 });
        await user1.save();

        const user2 = new User();
        user2.populate({ firstName: "John Old", lastName: "Doe Old", age: 350 });
        await user2.save();

        const users1 = await User.find({ query: { age: 250 } });
        expect(users1.length).toBe(1);
        expect(users1[0].firstName).toEqual("John");

        const users2 = await User.find({ query: { age: 350 } });
        expect(users2.length).toBe(1);
        expect(users2[0].firstName).toEqual("John Old");
    });

    test("should find by given ID correctly", async () => {
        const user1 = new User();
        user1.populate({ firstName: "John", lastName: "Doe", age: 250 });
        await user1.save();

        const noUser = await User.findById();
        expect(noUser).toBeNull();

        const foundUser = await User.findById(user1.id);
        expect(foundUser.id).toEqual(user1.id);
    });

    test("should delete entity", async () => {
        const user1 = new User();
        user1.populate({ firstName: "John Older", lastName: "Doe Older", age: 500 });
        await user1.save();

        const user2 = new User();
        user2.populate({ firstName: "John Oldest", lastName: "Doe Oldest", age: 1000 });
        await user2.save();

        const user1Find = await User.findOne({ query: { age: 500 } });
        await user1Find.delete();

        const user1FindAgain = await User.findOne({ query: { age: 500 } });
        expect(user1FindAgain).toBeNull();
    });

    test("should count entities", async () => {
        const currentCount = await User.count();
        expect(typeof currentCount).toBe("number");

        const user1 = new User();
        user1.populate({ firstName: "John Older", lastName: "Doe Older", age: 5000 });
        await user1.save();

        const user2 = new User();
        user2.populate({ firstName: "John Oldest", lastName: "Doe Oldest", age: 10000 });
        await user2.save();

        expect(await User.count()).toEqual(currentCount + 2);
        expect(await User.count({ query: { age: 5000 } })).toEqual(1);
        expect(await User.count({ query: { age: 10000 } })).toEqual(1);
    });
});
