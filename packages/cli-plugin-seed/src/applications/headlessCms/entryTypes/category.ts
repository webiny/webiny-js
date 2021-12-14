import { CliCommandSeedHeadlessCmsEntryType } from "~/plugins/CliCommandSeedHeadlessCmsEntryType";
import { CliSeedContext } from "~/types";
import { modelBuilderFactory } from "~/applications/headlessCms/builders/modelBuilderFactory";
import { textFieldBuilderFactory } from "~/applications/headlessCms/builders/modelFieldBuilderFactory";

const textFieldBuilder = textFieldBuilderFactory();

const titleField = textFieldBuilder.build({
    label: "Title"
});

const modelBuilder = modelBuilderFactory({
    name: "Category",
    modelId: "category"
})
    .addField(titleField)
    .setTitleFieldId(titleField);

export const createCategoryEntryType = (_: CliSeedContext) => {
    return new CliCommandSeedHeadlessCmsEntryType({
        modelBuilder
    });
};
