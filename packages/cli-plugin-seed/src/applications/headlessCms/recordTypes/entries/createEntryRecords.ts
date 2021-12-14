import { CmsEntry, CmsGroup, CmsModel } from "~/applications/headlessCms/graphql/types";
import { CliCommandSeedHeadlessCmsEntryType } from "~/plugins/CliCommandSeedHeadlessCmsEntryType";
import { createModel } from "~/applications/headlessCms/recordTypes/models/createModel";
import { GraphQLClient } from "graphql-request";
import { Logger } from "~/types";

export interface EntryPluginResult {
    model: CmsModel;
    entries: CmsEntry[];
}
export interface EntryPluginRecords {
    [plugin: string]: EntryPluginResult;
}
export interface Params {
    plugin: CliCommandSeedHeadlessCmsEntryType;
    client: GraphQLClient;
    group: CmsGroup;
    log: Logger;
}
export const createEntryRecords = async (params: Params): Promise<EntryPluginResult> => {
    const { plugin, client, log, group } = params;
    /**
     * We must pass the group because when on plugin, model builder was not initialized with a group connected.
     */
    const builder = plugin.getModelBuilder({
        group
    });

    const model = await createModel({
        client,
        builder,
        log
    });
    if (!model) {
        return null;
    }
};
