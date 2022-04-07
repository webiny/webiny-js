import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import {
    ApwContentTypes,
    ApwScheduleActionData,
    ApwScheduleActionStorageOperations,
    ApwScheduleActionTypes
} from "~/scheduler/types";
import { getIsoStringTillMinutes } from "~/scheduler/handlers/utils";
import { ClientContext } from "@webiny/handler-client/types";
import { PUBLISH_PAGE, UNPUBLISH_PAGE } from "./graphql";

export type HandlerArgs = {
    datetime: string;
    tenant: string;
    locale: string;
    futureDateTime: string;
};

interface Configuration {
    storageOperations: ApwScheduleActionStorageOperations;
}

/**
 * Handler that execute the provided action(s) for the schedule action workflow.
 */
export default ({
    storageOperations
}: Configuration): HandlerPlugin<ArgsContext<HandlerArgs>, ClientContext> => ({
    type: "handler",
    async handle(context): Promise<void> {
        const log = console.log;

        try {
            log("RUNNING ScheduleAction ExecuteAction Handler");
            const { invocationArgs: args } = context;

            const { futureDateTime: datetime } = args;
            /**
             * If there is no datetime we bail out early.
             */
            if (!datetime || typeof datetime !== "string") {
                log(`Bailing out!!`);
                return;
            }

            /**
             * Get tasks from the DB by datetime.
             */
            const [items] = await storageOperations.list({
                where: {
                    tenant: args.tenant || "root",
                    locale: args.locale || "en-US",
                    datetime_startsWith: getIsoStringTillMinutes(datetime)
                },
                sort: "datetime_ASC"
            });

            /**
             * Execute all actions.
             */
            if (items && items.length) {
                log(`Found ${items.length} actions.`);
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    log(
                        `Performing mutation "${item.data.action}" on "${item.data.type}" at "${item.data.datetime}"`
                    );
                    // Perform the actual action call.
                    const response = await context.handlerClient.invoke({
                        name: item.data.mainGraphqlFunctionArn,
                        payload: {
                            httpMethod: "POST",
                            headers: {
                                // TODO: Use real token - even if it's hard coded using plugins.
                                Authorization: "ben"
                            },
                            body: getGqlBody(item.data)
                        },
                        await: true
                    });
                    console.log(JSON.stringify({ body: response.body }, null, 2));
                    // const body = JSON.parse(response.body);

                    // TODO: Maybe update the status like error in original item in DB.
                }
            }
        } catch (e) {
            log("[HANDLER_EXECUTE_ACTION] Error => ", e);
            // TODO: Maybe update the status like error in original item in DB.
        }
    }
});

const getGqlBody = (data: ApwScheduleActionData): string => {
    let body = {};

    if (data.type === ApwContentTypes.PAGE) {
        if (data.action === ApwScheduleActionTypes.PUBLISH) {
            body = { query: PUBLISH_PAGE, variables: { id: data.entryId } };
        }
        if (data.action === ApwScheduleActionTypes.UNPUBLISH) {
            body = { query: UNPUBLISH_PAGE, variables: { id: data.entryId } };
        }
    }

    return JSON.stringify(body);
};
