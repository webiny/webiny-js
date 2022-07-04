import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { ApwScheduleActionData, ApwScheduleActionStorageOperations } from "~/scheduler/types";
import { getIsoStringTillMinutes, encodeToken, basePlugins } from "~/scheduler/handlers/utils";
import { ClientContext } from "@webiny/handler-client/types";
import { getApwSettings } from "~/scheduler/handlers/utils";
import { ContextPlugin } from "@webiny/handler";
import { PageBuilderGraphQL } from "./plugins/PageBuilderGraphQL";
import { HeadlessCMSGraphQL } from "./plugins/HeadlessCMSGraphQL";
import { ApplicationGraphQL } from "./plugins/ApplicationGraphQL";

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

        const applicationGraphQLPlugins = context.plugins.byType<ApplicationGraphQL>(
            ApplicationGraphQL.type
        );

        if (applicationGraphQLPlugins.length === 0) {
            console.error(`There are no plugins to determine GraphQL endpoints or mutations.`);
            return;
        }

        const applicationGraphQLPluginCache: Record<string, ApplicationGraphQL> = {};

        const getApplicationGraphQLPlugin = (
            data: ApwScheduleActionData
        ): ApplicationGraphQL | null => {
            const { type } = data;
            if (applicationGraphQLPluginCache[type]) {
                return applicationGraphQLPluginCache[type];
            }
            for (const plugin of applicationGraphQLPlugins) {
                if (!plugin.canUse(data)) {
                    continue;
                }
                applicationGraphQLPluginCache[type] = plugin;
                return plugin;
            }
            return null;
        };

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
                sort: ["datetime_ASC"],
                limit: 1000
            });

            /**
             * Execute all actions.
             */
            if (!items || items.length === 0) {
                return;
            }
            log(`Found ${items.length} actions.`);
            for (const item of items) {
                log(
                    `Performing mutation "${item.data.action}" on "${item.data.type}" at "${item.data.datetime}"`
                );

                const plugin = getApplicationGraphQLPlugin(item.data);
                if (!plugin) {
                    console.error(
                        `There is no plugin to determine GraphQL endpoint and mutations for type "${item.data.type}".`
                    );
                    console.log(JSON.stringify(item));
                    continue;
                }

                const name = plugin.getArn(apwSettings);

                const body = plugin.getGraphQLBody(item.data);

                if (!body) {
                    console.error(
                        `There is no GraphQL body defined, in the Plugin, for type "${item.data.type}".`
                    );
                    console.log(JSON.stringify(item));
                    continue;
                }

                // Perform the actual action call.
                const response = await context.handlerClient.invoke({
                    name,
                    payload: {
                        httpMethod: "POST",
                        headers: {
                            Authorization: encodeToken({
                                id: item.id,
                                locale: item.locale,
                                tenant: item.tenant
                            })
                        },
                        body: JSON.stringify(body)
                    },
                    await: true
                });
                console.log(JSON.stringify({ body: response.body }, null, 2));

                // TODO: Maybe update the status like error in original item in DB.
            }
        } catch (e) {
            log("[HANDLER_EXECUTE_ACTION] Error => ", e);
            // TODO: Maybe update the status like error in original item in DB.
        }
    }
});

export const executeActionHandlerPlugins = (config: Configuration) => [
    new ContextPlugin(async context => {
        context.plugins.register([new PageBuilderGraphQL(), new HeadlessCMSGraphQL()]);
    }),
    basePlugins(),
    executeActionLambda(config)
];
