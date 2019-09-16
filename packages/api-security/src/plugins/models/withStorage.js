import { withStorage } from "@commodo/fields-storage";
import { MongoDbDriver, withId } from "@commodo/fields-storage-mongodb";
import { flow } from "lodash";

export default ({ database }) => base =>
    flow(
        withId(),
        withStorage({
            driver: new MongoDbDriver({
                database: database.mongodb
            })
        })
    )(base);
