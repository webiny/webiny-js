import mdbid from "mdbid";

export default async db => {
    const envId = mdbid();
    await db.getCollection("CmsEnvironment").insertOne({
        id: envId,
        name: "Production",
        slug: "production",
        default: true
    });

    await db.getCollection("CmsEnvironmentAlias").insertOne({
        name: "Production",
        slug: "production",
        default: true,
        environment: envId
    });
};
