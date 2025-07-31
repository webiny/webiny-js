import { ContextPlugin } from "@webiny/api/index.js";
import type {
    SchedulerClient,
    SchedulerClientConfig
} from "@webiny/aws-sdk/client-scheduler/index.js";
import { createSchedulerService } from "~/service/SchedulerService.js";
import { getManifest } from "~/manifest.js";
import { convertException } from "@webiny/utils";
import type { ScheduleContext } from "~/types.js";
import { createScheduler } from "./scheduler/createScheduler.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { NotFoundError } from "@webiny/handler-graphql";
import { SCHEDULE_MODEL_ID } from "./constants.js";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { attachLifecycleHooks } from "~/hooks/index.js";

export interface ICreateHeadlessCmsSchedulerContextParams {
    getClient(config?: SchedulerClientConfig): Pick<SchedulerClient, "send">;
}

export const createHeadlessCmsScheduleContext = (
    params: ICreateHeadlessCmsSchedulerContextParams
) => {
    return new ContextPlugin<ScheduleContext>(async context => {
        /**
         * If the Headless CMS is not ready, it means the system is not fully installed yet.
         * We do not want to continue because it would break anyway.
         */
        const ready = await isHeadlessCmsReady(context);
        if (!ready) {
            return;
        }
        const manifest = await getManifest({
            client: context.db.driver.getClient() as DynamoDBDocument
        });
        if (manifest.error) {
            console.error(manifest.error.message);
            console.log(convertException(manifest.error, ["message"]));
            console.info("Scheduler not attached.");
            return;
        }

        const service = createSchedulerService({
            getClient: params.getClient,
            config: {
                lambdaArn: manifest.data.lambdaArn,
                roleArn: manifest.data.roleArn
            }
        });

        let schedulerModel: CmsModel;
        try {
            schedulerModel = await context.cms.getModel(SCHEDULE_MODEL_ID);
        } catch (ex) {
            if (ex.code === "NOT_FOUND" || ex instanceof NotFoundError) {
                console.error(`Schedule model "${SCHEDULE_MODEL_ID}" not found.`);
                return;
            }
            console.error(`Error while fetching schedule model "${SCHEDULE_MODEL_ID}".`);
            console.log(convertException(ex));
            return;
        }

        attachLifecycleHooks({
            cms: context.cms,
            schedulerModel
        });

        context.cms.scheduler = await createScheduler({
            cms: context.cms,
            security: context.security,
            service,
            schedulerModel
        });
    });
};
