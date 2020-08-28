export default ({ database }) =>
    database.collection("CmsAccessToken").insert({
        id: "a1a1a1a1a1a1a1a1a1a1a1a1",
        name: "Default Access Token",
        description: "This is the initial environment.",
        token: "some-random-token",
        scopes: ["*"]
    });
