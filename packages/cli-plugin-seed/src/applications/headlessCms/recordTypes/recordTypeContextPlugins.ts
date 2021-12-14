import { CliCommandSeedHeadlessCmsRecordType } from "~/plugins/CliCommandSeedHeadlessCmsRecordType";
import { CliSeedContext } from "~/types";

export const getRecordTypeContextPlugins = (
    context: CliSeedContext
): CliCommandSeedHeadlessCmsRecordType[] => {
    const plugins = context.plugins.byType<CliCommandSeedHeadlessCmsRecordType>(
        CliCommandSeedHeadlessCmsRecordType.type
    );
    if (plugins.length > 0) {
        return plugins;
    }
    throw new Error(`There are no CliCommandSeedHeadlessCmsRecordType defined in the context.`);
};
