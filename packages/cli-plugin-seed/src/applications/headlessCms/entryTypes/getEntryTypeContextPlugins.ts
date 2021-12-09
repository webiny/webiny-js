import { CliCommandSeedHeadlessCmsEntryType } from "~/plugins/CliCommandSeedHeadlessCmsEntryType";
import { CliContext } from "@webiny/cli/types";

export const getEntryTypeContextPlugins = (
    context: CliContext
): CliCommandSeedHeadlessCmsEntryType[] => {
    const plugins = context.plugins.byType<CliCommandSeedHeadlessCmsEntryType>(
        CliCommandSeedHeadlessCmsEntryType.type
    );
    if (plugins.length > 0) {
        return plugins;
    }
    throw new Error(`There are no CliCommandSeedHeadlessCmsEntryType defined in the context.`);
};
