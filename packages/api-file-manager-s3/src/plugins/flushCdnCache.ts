// import { CloudFront } from "@webiny/aws-sdk/client-cloudfront";
import { ContextPlugin } from "@webiny/api";
import { FileManagerContext } from "@webiny/api-file-manager/types";
// import { ServiceDiscovery } from "@webiny/api";

export const flushCdnCache = () => {
    return new ContextPlugin<FileManagerContext>(context => {
        context.fileManager.onFileBeforeUpdate.subscribe(async ({ file, original }) => {
            const prevAccessControl = original.accessControl;
            const newAccessControl = file.accessControl;

            if (prevAccessControl?.type === newAccessControl?.type) {
                return;
            }

            // const { api } = await ServiceDiscovery.load();
            // const { distributionId } = api.cloudfront;

            const invalidatePaths = [
                `/files/${file.key}*`,
                `/private/${file.key}*`,
                ...file.aliases
            ];
        });

        context.fileManager.onFileAfterDelete.subscribe(async ({ file }) => {
            // TODO: flush cache
        });
    });
};

// const cloudfront = new CloudFront();
// try {
//     await cloudfront.createInvalidation({
//         DistributionId: distributionId,
//         InvalidationBatch: {
//             CallerReference: `${new Date().getTime()}-api-prerender-service-aws-after-flush`,
//             Paths: {
//                 Quantity: 1,
//                 Items: [path]
//             }
//         }
//     });
// } catch (e) {
//     console.error(
//         `Failed to issue a cache invalidation request to CloudFront distribution "${distributionId}".`,
//         e.stack
//     );
//     return;
// }
