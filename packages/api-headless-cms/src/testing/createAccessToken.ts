export default ({ database }) =>
    database
        .collection("CmsAccessToken")
        .insert({ id: "fashiohifosd", name: "Access Token #3", description: "...description" });
