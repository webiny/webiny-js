import { ProcessParams } from "~/plugins/CliCommandSeedHeadlessCmsRecordType";
import { getEntryTypeContextPlugins } from "~/applications/headlessCms/entryTypes/entryTypeContextPlugins";
import { processEntryPlugins } from "./processEntryPlugins";
import { createGroup } from "~/applications/headlessCms/recordTypes/groups/createGroup";

export const processEntries = async (params: ProcessParams) => {
    const { context, client, log, answers } = params;

    const group = await createGroup({
        client,
        log
    });
    if (!group) {
        return;
    }

    const { entryTypes = [] } = answers;

    const plugins = getEntryTypeContextPlugins(context).filter(entryType =>
        entryTypes.includes(entryType.getId())
    );

    const records = await processEntryPlugins({
        ...params,
        group,
        plugins,
        targets: plugins
    });

    console.log(records);

    // await processEntryPlugins({
    //     plugins,
    //     group
    // });
};
