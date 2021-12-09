import { CliCommandSeedApplication, ProcessParams } from "~/plugins/CliCommandSeedApplication";
import { getEntryTypeContextPlugins } from "~/applications/headlessCms/entryTypes/getEntryTypeContextPlugins";

export const processHeadlessCms = async (
    _: CliCommandSeedApplication,
    params: ProcessParams
): Promise<void> => {
    const { context, ora, answers, log } = params;

    const entryTypePlugins = getEntryTypeContextPlugins(context);

    const { entryTypes } = answers;

    const selectedEntryTypes = entryTypePlugins.filter(item => entryTypes.includes(item.getId()));
    if (selectedEntryTypes.length === 0) {
        log.red(
            `There are no selected entry types plugins to be generated (${entryTypes.join(",")}).`
        );
        return;
    }

    log.yellow("Processing Headless CMS application...");
    ora.start();
    for (const key in answers) {
        log.green(`Running action based on "${key}" -> ${answers[key]}.`);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    ora.stop();
    log.yellow("...done");
};
