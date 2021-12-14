import { CmsGroup } from "~/applications/headlessCms/graphql/types";
import { CliCommandSeedHeadlessCmsEntryType } from "~/plugins/CliCommandSeedHeadlessCmsEntryType";
import { createEntryRecords, EntryPluginRecords } from "./createEntryRecords";
import { GraphQLClient } from "graphql-request";
import { Logger } from "~/types";

export interface Params {
    plugins: CliCommandSeedHeadlessCmsEntryType[];
    targets: CliCommandSeedHeadlessCmsEntryType[];
    group: CmsGroup;
    client: GraphQLClient;
    log: Logger;
}

export const processEntryPlugins = async (params: Params): Promise<EntryPluginRecords> => {
    const { plugins, targets, log } = params;
    const records: EntryPluginRecords = {};
    for (const plugin of targets) {
        /**
         * We do not check for circular dependencies. Devs should be careful about that.
         */
        const dependencies = plugin.getDependencies();
        if (dependencies.length > 0) {
            /**
             * Process entry plugin dependencies.
             */
            const pluginsRecords = await processEntryPlugins({
                ...params,
                targets: plugins.filter(pl => {
                    if (records[pl.getId()]) {
                        return false;
                    }
                    return dependencies.includes(pl.getId());
                })
            });
            /**
             * Assign created records to main holder object.
             */
            for (const key in pluginsRecords) {
                records[key] = pluginsRecords[key];
            }
        }
        /**
         * Finally, create records for given plugin and assign to the main holder object.
         */
        const result = await createEntryRecords({
            ...params,
            plugin
        });
        if (!result) {
            /**
             * Just note that plugin records creation was attempted - we do not want to do this plugin again if in some dependency.
             */
            records[plugin.getId()] = {
                model: null,
                entries: []
            };
            log.red(
                `Could not create records for plugin "${plugin.getId()}", model "${plugin.getModelId()}".`
            );
            continue;
        }
        records[plugin.getId()] = result;
    }
    return records;
};
