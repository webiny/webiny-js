import { createFeature } from "@webiny/feature/api";
import { CreateFileFeature } from "~/features/file/CreateFile/feature.js";
import { CreateFilesInBatchFeature } from "~/features/file/CreateFilesInBatch/feature.js";
import { DeleteFileFeature } from "~/features/file/DeleteFile/feature.js";
import { GetFileFeature } from "~/features/file/GetFile/feature.js";
import { ListFilesFeature } from "~/features/file/ListFiles/feature.js";
import { ListTagsFeature } from "~/features/file/ListTags/feature.js";
import { UpdateFileFeature } from "~/features/file/UpdateFile/feature.js";
import { SettingsInstallerFeature } from "~/features/settings/SettingsInstaller/feature.js";
import { GetSettingsFeature } from "~/features/settings/GetSettings/feature.js";
import { UpdateSettingsFeature } from "~/features/settings/UpdateSettings/feature.js";
import { ListImagesByTagToolFeature } from "~/features/file/ListImagesByTagTool/feature.js";
import { FileUrlGeneratorFeature } from "~/features/file/FileUrlGenerator/feature.js";

export const FileManagerFeature = createFeature({
    name: "FileManager",
    register(container) {
        CreateFileFeature.register(container);
        CreateFilesInBatchFeature.register(container);
        UpdateFileFeature.register(container);
        DeleteFileFeature.register(container);
        GetFileFeature.register(container);
        ListFilesFeature.register(container);
        ListTagsFeature.register(container);
        SettingsInstallerFeature.register(container);
        GetSettingsFeature.register(container);
        UpdateSettingsFeature.register(container);
        ListImagesByTagToolFeature.register(container);
        FileUrlGeneratorFeature.register(container);
    }
});
