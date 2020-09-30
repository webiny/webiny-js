export const CONTENT_MODEL_GROUP_ID = "c1c1c1c1c1c1c1c1c1c1c1c1";
import { environmentId as defaultEnvironmentId } from "./createEnvironment";

export default ({ database, environmentId = defaultEnvironmentId }) =>
    database.collection("CmsContentModelGroup").insert({
        id: CONTENT_MODEL_GROUP_ID,
        name: "Ungrouped",
        slug: "ungrouped",
        description: "A generic content model group",
        icon: "fas/star",
        environment: environmentId
    });
