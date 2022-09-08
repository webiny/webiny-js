const Cloudfront = require("aws-sdk/clients/cloudfront");

const cf = new Cloudfront({ region: process.env.AWS_REGION || "eu-central-1" });

async function deleteFunction(cfFunction) {
    console.log(`[${cfFunction.Name}] Trying to delete...`);

    const { ETag } = await cf
        .describeFunction({ Name: cfFunction.Name, Stage: cfFunction.FunctionMetadata.Stage })
        .promise();

    return cf
        .deleteFunction({ Name: cfFunction.Name, IfMatch: ETag })
        .promise()
        .then(() => {
            console.log(`[${cfFunction.Name}] Deleted!`);
            return true;
        })
        .catch(err => {
            console.log(`[${cfFunction.Name}] Error: ${err.message}`);
            return false;
        });
}

(async () => {
    let nextToken;
    let count = 0;
    while (true) {
        const { Items, NextMarker } = await cf
            .listFunctions({ Marker: nextToken, MaxItems: "10" })
            .promise();

        nextToken = NextMarker;

        const results = await Promise.all(Items.map(deleteFunction));

        count += results.filter(Boolean).length;

        if (!nextToken) {
            break;
        }
    }

    console.log(`Deleted ${count} CloudfrontFunction resources.`);
})();
