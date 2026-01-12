import { Model } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";

export const FILE_MODEL_ID = "fmFile";

class FilePrivateModelImpl implements Model.Interface {
    constructor(private wcp: WcpContext.Interface) {}

    buildModel(builder: Model.Builder) {
        const model = builder.private().modelId(FILE_MODEL_ID).name("FmFile");
        const privateFiles = this.wcp.canUsePrivateFiles();

        model.fields(fields => ({
            location: fields.location(),
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
                .list()
                .required("Value is required.")
        }));

        if (privateFiles) {
            model.fields(fields => ({
                accessControl: fields
                    .object()
                    .label("Access Control")
                    .tags(["$bulk-edit"])
                    .fields(fields => ({
                        type: fields
                            .text()
                            .label("Type")
                            .predefinedValues([
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
                            ])
                    }))
            }));
        }

        return model;
    }
}

export const FileModel = Model.createImplementation({
    implementation: FilePrivateModelImpl,
    dependencies: [WcpContext]
});
