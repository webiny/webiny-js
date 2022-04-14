import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { ApwScheduleActionStorageOperations } from "~/scheduler/types";
import { getIsoStringTillMinutes, encodeToken, basePlugins } from "~/scheduler/handlers/utils";
import { ClientContext } from "@webiny/handler-client/types";
import { getApwSettings } from "~/scheduler/handlers/utils";
import { getGqlBody } from "./executeAction.utils";

export type HandlerArgs = {
    datetime: string;
    tenant: string;
    locale: string;
    futureDatetime: string;
};

interface Configuration {
    storageOperations: ApwScheduleActionStorageOperations;
}

/**
 * Handler that execute the provided action(s) for the schedule action workflow.
 */
const executeActionLambda = ({
    storageOperations
}: Configuration): HandlerPlugin<ArgsContext<HandlerArgs>, ClientContext> => ({
    type: "handler",
    async handle(context): Promise<void> {
        const log = console.log;

        try {
            const { invocationArgs: args } = context;
            const apwSettings = await getApwSettings();
            const { futureDatetime: datetime } = args;
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
                    tenant: args.tenant,
                    locale: args.locale,
                    datetime_startsWith: getIsoStringTillMinutes(datetime)
                },
                sort: "datetime_ASC",
                limit: 1000
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
                        name: apwSettings.mainGraphqlFunctionArn,
                        payload: {
                            httpMethod: "POST",
                            headers: {
                                Authorization: encodeToken({
                                    id: item.id,
                                    locale: item.locale,
                                    tenant: item.tenant
                                })
                            },
                            body: getGqlBody(item.data)
                        },
                        await: true
                    });
                    console.log(JSON.stringify({ body: response.body }, null, 2));

                    // TODO: Maybe update the status like error in original item in DB.
                }
            }
        } catch (e) {
            log("[HANDLER_EXECUTE_ACTION] Error => ", e);
            // TODO: Maybe update the status like error in original item in DB.
        }
    }
});

export const executeActionHandlerPlugins = (config: Configuration) => [
    basePlugins(),
    executeActionLambda(config)
];
