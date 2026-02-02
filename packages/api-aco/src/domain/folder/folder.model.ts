import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";

export const FOLDER_MODEL_ID = process.env.WEBINY_API_LEGACY_MODELS ? "acoFolder" : "wbyAcoFolder";

class FolderPrivateModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private()
                .modelId(FOLDER_MODEL_ID)
                .name("ACO - Folder")
                .fields(fields => ({
                    title: fields.text().label("Title").required("Value is required."),
                    slug: fields
                        .text()
                        .label("Slug")
                        .required("Value is required.")
                        .pattern(
                            "^[a-z0-9]+(-[a-z0-9]+)*$",
                            "g",
                            "Value must consist of only 'a-z', '0-9' and '-'."
                        ),
                    type: fields.text().label("Type").required("Value is required."),
                    parentId: fields.text().label("Parent Id"),
                    path: fields.text().label("Path"),
                    permissions: fields
                        .object()
                        .label("Permissions")
                        .list()
                        .fields(fields => ({
                            target: fields.text().label("Target").required("Value is required."),
                            level: fields
                                .text()
                                .label("Level")
                                .required("Value is required.")
                                .predefinedValues([
                                    {
                                        label: "Viewer",
                                        value: "viewer"
                                    },
                                    {
                                        label: "Editor",
                                        value: "editor"
                                    },
                                    {
                                        label: "Owner",
                                        value: "owner"
                                    },
                                    {
                                        label: "Public",
                                        value: "public"
                                    },
                                    {
                                        label: "No Access",
                                        value: "no-access"
                                    }
                                ])
                        }))
                        .layout([["target"], ["level"]]),
                    extensions: fields.object().label("Extensions")
                }))
        ];
    }
}

export const FolderModel = ModelFactory.createImplementation({
    implementation: FolderPrivateModelImpl,
    dependencies: []
});
