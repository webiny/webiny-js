// Not used at the moment, but left it here as it's a whole sample. No need to go to DynamoDB and look for it.
const sampleRenderItem = i => ({
    PK: "T#root#PS#RENDER",
    SK: `https://site.com/test-${i}`,
    TYPE: "ps.render",
    url: `https://site.com/test-${i}`,
    args: {
        url: `https://site.com/test-${i}`,
        configuration: {
            meta: {
                cloudfront: {
                    distributionId: "xyz"
                }
            },
            db: {
                namespace: "T#root"
            },
            storage: {
                name: "s3-bucket-name",
                folder: "test-folder"
            }
        }
    },
    files: [
        {
            name: "index.html",
            type: "text/html",
            meta: {
                tags: [
                    { value: `page-id-${i}`, key: "pb-page" },
                    { value: "main-menu", key: "pb-menu" }
                ]
            }
        },
        {
            name: "graphql.json",
            type: "application/json",
            meta: {}
        }
    ]
});
