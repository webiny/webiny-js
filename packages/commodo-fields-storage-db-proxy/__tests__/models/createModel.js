import { withStorage } from "@commodo/fields-storage";
import { MongoDbDriver, withId } from "@commodo/fields-storage-mongodb";
import { database } from "./../database";
import { compose } from "ramda";

const createModel = base =>
    compose(
        withId(),
        withStorage({
            driver: new MongoDbDriver({
                database
            })
        })
    )(base);

export default createModel;
