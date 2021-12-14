import { CliCommandSeedHeadlessCmsEntryType } from "~/plugins/CliCommandSeedHeadlessCmsEntryType";
import { CliSeedContext } from "~/types";
import { modelBuilderFactory } from "~/applications/headlessCms/builders/modelBuilderFactory";
import {
    dateFieldBuilderFactory,
    richTextFieldBuilderFactory,
    textFieldBuilderFactory
} from "../builders/modelFieldBuilderFactory";

const textFieldBuilder = textFieldBuilderFactory();
const richTextFieldBuilder = richTextFieldBuilderFactory();
const dateFieldBuilder = dateFieldBuilderFactory();

const nameField = textFieldBuilder.build({
    label: "Name"
});

const biographyField = richTextFieldBuilder.build({
    label: "Biography"
});

const ageField = dateFieldBuilder.build({
    label: "Age"
});

const modelBuilder = modelBuilderFactory({
    modelId: "author",
    name: "Author"
})
    .addField(nameField)
    .addField(biographyField)
    .addField(ageField)
    .setTitleFieldId(nameField);

export const createAuthorEntryType = (_: CliSeedContext) => {
    return new CliCommandSeedHeadlessCmsEntryType({
        modelBuilder
    });
};
