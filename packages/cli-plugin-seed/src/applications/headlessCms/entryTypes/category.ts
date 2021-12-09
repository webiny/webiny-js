import { CliCommandSeedHeadlessCmsEntryType } from "~/plugins/CliCommandSeedHeadlessCmsEntryType";

export const createCategoryEntryType = () => {
    return new CliCommandSeedHeadlessCmsEntryType({
        id: "category",
        name: "Category"
    });
};
