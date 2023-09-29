import { NotAuthorizedError } from "@webiny/api-security";
import { AcoContext } from "~/types";

interface FileManagerCrudDecoratorsParams {
    context: AcoContext;
}

export class FileManagerCrudDecorators {
    private readonly context: AcoContext;

    // TODO: Not smart to pass the whole `context`. We probably want to refactor this.
    constructor({ context }: FileManagerCrudDecoratorsParams) {
        this.context = context;
    }

    decorate() {
        const context = this.context;
        const folderLevelPermissions = context.aco.folderLevelPermissions;

        const originalFmListFiles = context.fileManager.listFiles.bind(context.fileManager);
        context.fileManager.listFiles = async params => {
            const [allFolders] = await context.aco.folder.listAll({
                where: { type: "FmFile" }
            });

            return originalFmListFiles({
                ...params,
                where: {
                    AND: [
                        params?.where || {},
                        {
                            location: {
                                // At the moment, all users can access files in the root folder.
                                // Root folder level permissions cannot be set yet.
                                folderId_in: ["root", ...allFolders.map(folder => folder.id)]
                            }
                        }
                    ]
                }
            });
        };

        const originalFmGetFile = context.fileManager.getFile.bind(context.fileManager);
        context.fileManager.getFile = async fileId => {
            const file = await originalFmGetFile(fileId);

            if (file && file.location.folderId !== "root") {
                const folder = await context.aco.folder.get(file.location.folderId);
                const canAccessFileFolder = await folderLevelPermissions.canAccessFolderContent({
                    folder,
                    rwd: "r"
                });

                if (!canAccessFileFolder) {
                    throw new NotAuthorizedError();
                }
            }

            return file;
        };

        const originalFmCreateFile = context.fileManager.createFile.bind(context.fileManager);
        context.fileManager.createFile = async params => {
            if (params.location?.folderId && params.location.folderId !== "root") {
                const folder = await context.aco.folder.get(params.location.folderId);
                const canAccessFileFolder = await folderLevelPermissions.canAccessFolderContent({
                    folder,
                    rwd: "w"
                });

                if (!canAccessFileFolder) {
                    throw new NotAuthorizedError();
                }
            }

            return originalFmCreateFile(params);
        };

        const originalFmUpdateFile = context.fileManager.updateFile.bind(context.fileManager);
        context.fileManager.updateFile = async (fileId, data) => {
            const file = await originalFmGetFile(fileId);

            if (file.location?.folderId && file.location.folderId !== "root") {
                const folder = await context.aco.folder.get(file.location.folderId);
                const canAccessFileFolder = await folderLevelPermissions.canAccessFolderContent({
                    folder,
                    rwd: "w"
                });

                if (!canAccessFileFolder) {
                    throw new NotAuthorizedError();
                }
            }

            return originalFmUpdateFile(fileId, data);
        };

        const originalFmDeleteFile = context.fileManager.deleteFile.bind(context.fileManager);
        context.fileManager.deleteFile = async fileId => {
            const file = await originalFmGetFile(fileId);

            if (file.location?.folderId && file.location.folderId !== "root") {
                const folder = await context.aco.folder.get(file.location.folderId);
                const canAccessFileFolder = await folderLevelPermissions.canAccessFolderContent({
                    folder,
                    rwd: "d"
                });

                if (!canAccessFileFolder) {
                    throw new NotAuthorizedError();
                }
            }

            return originalFmDeleteFile(fileId);
        };
    }
}
