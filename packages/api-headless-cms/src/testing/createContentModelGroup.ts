export default ({ database, environmentId = "e1e1e1e1e1e1e1e1e1e1e1e1" }) =>
    database.collection("CmsContentModelGroup").insert({
        id: "c1c1c1c1c1c1c1c1c1c1c1c1",
        name: "Ungrouped",
        slug: "ungrouped",
        description: "A generic content model group",
        icon: "fas/star",
        environment: environmentId
    });
