import { CliCommandSeedHeadlessCmsEntryType } from "~/plugins/CliCommandSeedHeadlessCmsEntryType";

export const createArticleEntryType = () => {
    return new CliCommandSeedHeadlessCmsEntryType({
        id: "article",
        name: "Article",
        dependencies: ["category", "author"]
    });
};
