import { compose } from "ramda";
import { withStorage } from "@commodo/fields-storage";
import { MongoDbDriver, withId } from "@commodo/fields-storage-mongodb";
import { database } from "./database";
import { withProps } from "repropose";

describe("withId test", function() {
    it(`should assign "id" field `, async () => {
        const createModel = base =>
            compose(
                withId(),
                withStorage({
                    driver: new MongoDbDriver({
                        database
                    })
                })
            )(base);

        const Model = createModel();
        const model = new Model();

        expect(model.getField('id').type).toBe('string')
    });

    it(`should allow assigning additional HOFs before and after withStorage`, async () => {
        const createModel = base =>
            compose(
                withProps({ after: "after" }),
                withId(),
                withProps({ before: "before" }),
                withStorage({
                    driver: new MongoDbDriver({
                        database
                    })
                })
            )(base);

        const Model = createModel();
        const model = new Model();
        expect(model.before).toBe("before");
        expect(model.after).toBe("after");
    });
});
