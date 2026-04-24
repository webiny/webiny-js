import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";

export const FILE_MODEL_ID = process.env.WEBINY_API_LEGACY_MODELS ? "fmFile" : "wbyFmFile";

class FilePrivateModelImpl implements ModelFactory.Interface {
    public constructor(private wcp: WcpContext.Interface) {}

    public async execute(builder: ModelFactory.Builder) {
        const model = builder.private({
            modelId: FILE_MODEL_ID,
            name: "FmFile"
        });
        const privateFiles = this.wcp.canUsePrivateFiles();

        model.fields(fields => ({
            name: fields.text().label("Name").required("Value is required."),
            key: fields.text().label("Key").required("Value is required."),
            type: fields.text().label("Type").required("Value is required."),
            size: fields.number().label("Size").required("Value is required."),
            metadata: fields
                .object()
                .label("Metadata")
                .renderer("hidden")
                .fields(fields => ({
                    image: fields
                        .object()
                        .label("Image")
                        .fields(fields => ({
                            width: fields.number().label("Width"),
                            height: fields.number().label("Height"),
                            format: fields.text().label("Format"),
                            orientation: fields.number().label("Orientation")
                        })),
                    // Store complete raw EXIF as JSON
                    exif: fields.searchableJson().label("EXIF Data"),
                    // Store complete raw IPTC as JSON
                    iptc: fields.searchableJson().label("IPTC Data")
                })),
            tags: fields
                .text()
                .label("Tags")
                .tags(["$bulk-edit"])
                .list()
                .required("Value is required."),
            description: fields.text().label("Description").defaultValue("")
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

        return [model];
    }
}

export const FileModel = ModelFactory.createImplementation({
    implementation: FilePrivateModelImpl,
    dependencies: [WcpContext]
});
