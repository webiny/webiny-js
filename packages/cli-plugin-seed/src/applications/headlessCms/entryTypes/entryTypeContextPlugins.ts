import { CliCommandSeedHeadlessCmsEntryType } from "~/plugins/CliCommandSeedHeadlessCmsEntryType";
import { CliSeedContext } from "~/types";

export const getEntryTypeContextPlugins = (
    context: CliSeedContext
): CliCommandSeedHeadlessCmsEntryType[] => {
    const plugins = context.plugins.byType<CliCommandSeedHeadlessCmsEntryType>(
        CliCommandSeedHeadlessCmsEntryType.type
    );
    if (plugins.length > 0) {
        return plugins;
    }
    throw new Error(
        `There are no "CliCommandSeedHeadlessCmsEntryType" plugins defined in the context.`
    );
};
