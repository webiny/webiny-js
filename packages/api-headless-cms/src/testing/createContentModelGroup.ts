export const CONTENT_MODEL_GROUP_ID = "c1c1c1c1c1c1c1c1c1c1c1c1";

export default ({ database, environmentId = "e1e1e1e1e1e1e1e1e1e1e1e1" }) =>
    database.collection("CmsContentModelGroup").insert({
        id: CONTENT_MODEL_GROUP_ID,
        name: "Ungrouped",
        slug: "ungrouped",
        description: "A generic content model group",
        icon: "fas/star",
        environment: environmentId
    });
