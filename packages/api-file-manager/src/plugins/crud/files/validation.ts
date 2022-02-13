import { FilePlugin } from "~/plugins/definitions/FilePlugin";
import createFileModel from "~/plugins/crud/utils/createFileModel";

export default (): FilePlugin[] => [
    new FilePlugin({
        beforeCreate: async ({ data }) => {
            const FileModel = createFileModel();
            const fileData = new FileModel().populate(data);
            await fileData.validate();
        },
        beforeUpdate: async ({ data }) => {
            const FileModel = createFileModel(false);
            const updatedFileData = new FileModel().populate(data);
            await updatedFileData.validate();
        },
        beforeBatchCreate: async ({ data }) => {
            const FileModel = createFileModel();
            for (const input of data) {
                const fileInstance = new FileModel().populate(input);
                await fileInstance.validate();
            }
        }
    })
];
