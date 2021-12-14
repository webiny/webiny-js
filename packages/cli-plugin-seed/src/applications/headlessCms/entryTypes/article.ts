import { CliCommandSeedHeadlessCmsEntryType } from "~/plugins/CliCommandSeedHeadlessCmsEntryType";
import { CliSeedContext } from "~/types";
import { modelBuilderFactory } from "~/applications/headlessCms/builders/modelBuilderFactory";
import { textFieldBuilderFactory } from "~/applications/headlessCms/builders/modelFieldBuilderFactory";

const textFieldBuilder = textFieldBuilderFactory();

const titleField = textFieldBuilder.build({
    label: "title"
});

const modelBuilder = modelBuilderFactory({
    name: "Category",
    modelId: "category"
})
    .addField(titleField)
    .setTitleFieldId(titleField);

export const createArticleEntryType = (_: CliSeedContext) => {
    return new CliCommandSeedHeadlessCmsEntryType({
        modelBuilder,
        dependencies: ["category", "author"]
    });
};
