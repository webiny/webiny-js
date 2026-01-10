import { PrivateModel } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";

export const FILE_MODEL_ID = "fmFile";

class FilePrivateModelImpl implements PrivateModel.Interface {
    constructor(private wcp: WcpContext.Interface) {}

    buildModel(builder: PrivateModel.Builder): PrivateModel.Builder {
        const privateFiles = this.wcp.canUsePrivateFiles();

        builder
            .modelId(FILE_MODEL_ID)
            .name("FmFile")
            .fields(fields => ({
                location: fields
                    .object()
                    .label("Location")
                    .fields(fields => ({
                        folderId: fields
                            .text()
                            .label("Folder ID")
                            .settings({ path: "location.folderId" })
                    })),
                name: fields.text().label("Name").required("Value is required."),
                key: fields.text().label("Key").required("Value is required."),
                type: fields.text().label("Type").required("Value is required."),
                size: fields.number().label("Size").required("Value is required."),
                meta: fields
                    .object()
                    .label("Meta")
                    .fields(fields => ({
                        private: fields.boolean().label("Private"),
                        width: fields.number().label("Width"),
                        height: fields.number().label("Height"),
                        originalKey: fields.text().label("Original Key")
                    })),
                tags: fields
                    .text()
                    .label("Tags")
                    .tags(["$bulk-edit"])
                    .multipleValues(true)
                    .required("Value is required.")
            }));

        if (privateFiles) {
            builder.fields(fields => ({
                accessControl: fields
                    .object()
                    .label("Access Control")
                    .tags(["$bulk-edit"])
                    .fields(fields => ({
                        type: fields
                            .text()
                            .label("Type")
                            .predefinedValues({
                                enabled: true,
                                values: [
                                    {
                                        label: "Public",
                                        value: "public",
                                        selected: true
                                    },
                                    {
                                        label: "Private",
                                        value: "private-authenticated",
                                        selected: false
                                    }
                                ]
                            })
                    }))
            }));
        }

        return builder;
    }
}

export const FilePrivateModel = PrivateModel.createImplementation({
    implementation: FilePrivateModelImpl,
    dependencies: [WcpContext]
});
