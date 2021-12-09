import { CliCommandSeedHeadlessCmsEntryType } from "~/plugins/CliCommandSeedHeadlessCmsEntryType";

export const createAuthorEntryType = () => {
    return new CliCommandSeedHeadlessCmsEntryType({
        id: "author",
        name: "Author"
    });
};
