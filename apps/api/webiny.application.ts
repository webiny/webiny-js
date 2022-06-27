/**
 * For more information on the API project application, please see:
 * https://www.webiny.com/docs/key-topics/cloud-infrastructure/api/introduction
 */
import { createApiApp } from "@webiny/serverless-cms-aws";
// import { addApwScheduler } from "./pulumi/addApwScheduler";

export default createApiApp({
    // pulumi(app) {
    //     // APW is in development, so we don't include it directly in the `pulumi-aws`.
    //     // Instead, we use Pulumi app customization API to apply APW setup only in our repo.
    //     addApwScheduler(app);
    // }
});
