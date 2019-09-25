// @flow
import { flow } from "lodash";
import { withUser } from "@webiny/api-security";
import { withStorage } from "@webiny/commodo";
import { MongoDbDriver, withId } from "@commodo/fields-storage-mongodb";
import cmsContent from "./models/cmsContent.model";

export default ({ database }) => ({
    name: "graphql-context-models",
    type: "graphql-context",
    apply(context) {
        const driver = new MongoDbDriver({
            database: database.mongodb
        });

        const createBase = () =>
            flow(
                withId(),
                withStorage({ driver }),
                withUser(context)
            )();

        const ContentModel = cmsContent({ createBase });

        context.models = {
            ContentModel
        };
    }
});
