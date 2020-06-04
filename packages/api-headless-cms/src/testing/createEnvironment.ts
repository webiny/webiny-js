export default ({ database }) =>
    database.collection("CmsEnvironment").insert({
        id: "e1e1e1e1e1e1e1e1e1e1e1e1",
        name: "Initial Environment",
        description: "This is the initial environment.",
        createdFrom: null
    });
