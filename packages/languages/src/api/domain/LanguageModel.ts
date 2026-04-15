import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { LANGUAGE_MODEL_ID } from "~/shared/constants.js";

class LanguageModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder
            .public({
                modelId: LANGUAGE_MODEL_ID,
                name: "Language",
                group: "hidden"
            })
            .description("Manage system languages.")
            .titleFieldId("name")
            .icon("fas/language")
            .singularApiName("Language")
            .pluralApiName("Languages")
            .tags(["$publishing:false", "$hidden:true"]);

        model
            .fields(fields => ({
                name: fields
                    .text()
                    .label("Name")
                    .description(
                        "The display name for this language (e.g., German, English, Arabic)."
                    )
                    .required()
                    .renderer("textInput"),
                code: fields
                    .text()
                    .label("Code")
                    .description(
                        "A unique language or locale code used for URL routing and identifying content (e.g., en, de, pt-BR)."
                    )
                    .required()
                    .renderer("textInput"),
                direction: fields
                    .text()
                    .label("Direction")
                    .description(
                        "Controls the text direction. Most languages read left-to-right, but some (like Arabic and Hebrew) read right-to-left."
                    )
                    .defaultValue("ltr")
                    .renderer("dropdown")
                    .required()
                    .predefinedValues([
                        {
                            value: "ltr",
                            label: "LTR"
                        },
                        {
                            value: "rtl",
                            label: "RTL"
                        }
                    ]),
                isDefault: fields
                    .boolean()
                    .label("Is default?")
                    .description(
                        "Make this the primary language. Default language content is shown when no specific language is requested."
                    )
                    .defaultValue(false)
                    .renderer("switch"),
                enabled: fields
                    .boolean()
                    .label("Is enabled?")
                    .description(
                        "Disabled languages are hidden from the public site but can still be configured and translated in the admin."
                    )
                    .defaultValue(false)
                    .renderer("switch")
            }))
            .layout([["name"], ["code"], ["direction"], ["isDefault"], ["enabled"]]);

        return [model];
    }
}

export default ModelFactory.createImplementation({
    implementation: LanguageModelFactory,
    dependencies: []
});
