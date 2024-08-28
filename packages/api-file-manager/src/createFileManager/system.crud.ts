import { createTopic } from "@webiny/pubsub";
import { NotAuthorizedError } from "@webiny/api-security";
import {
    FileManagerContextObject,
    FileManagerSettings,
    FileManagerSystem,
    SystemCRUD
} from "~/types";
import WebinyError from "@webiny/error";
import { FileManagerConfig } from "~/createFileManager/index";

export const createSystemCrud = ({
    storageOperations,
    getTenantId,
    getIdentity,
    WEBINY_VERSION
}: FileManagerConfig): SystemCRUD => {
    return {
        onSystemBeforeInstall: createTopic("fileManager.onSystemBeforeInstall"),
        onSystemAfterInstall: createTopic("fileManager.onSystemAfterInstall"),
        async getVersion() {
            const system = await storageOperations.system.get({ tenant: getTenantId() });

            return system ? system.version : null;
        },
        async setVersion(version: string) {
            const system = await storageOperations.system.get({ tenant: getTenantId() });

            if (system) {
                const data: FileManagerSystem = {
                    ...system,
                    tenant: system.tenant || getTenantId(),
                    version
                };
                try {
                    await storageOperations.system.update({
                        original: system,
                        data
                    });
                    return;
                } catch (ex) {
                    throw new WebinyError(
                        "Could not update the system data.",
                        "SYSTEM_UPDATE_ERROR",
                        {
                            ...ex.data,
                            data
                        }
                    );
                }
            }

            const data: FileManagerSystem = {
                version,
                tenant: getTenantId()
            };
            try {
                await storageOperations.system.create({
                    data
                });
                return;
            } catch (ex) {
                throw new WebinyError("Could not create the system data.", "SYSTEM_CREATE_ERROR", {
                    ...ex.data,
                    data
                });
            }
        },
        async install(this: FileManagerContextObject, { srcPrefix }) {
            const identity = getIdentity();

            if (!identity) {
                throw new NotAuthorizedError();
            }

            const version = await this.getVersion();

            if (version) {
                throw new WebinyError(
                    "File Manager is already installed.",
                    "FILES_INSTALL_ABORTED"
                );
            }

            const data: Partial<FileManagerSettings> = {};

            if (srcPrefix) {
                data.srcPrefix = srcPrefix;
            }

            await this.onSystemBeforeInstall.publish({});

            await this.createSettings(data);
            await this.setVersion(WEBINY_VERSION);

            await this.onSystemAfterInstall.publish({});

            return true;
        }
    };
};
