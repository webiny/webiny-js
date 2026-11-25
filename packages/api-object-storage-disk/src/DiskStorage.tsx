import React from "react";
import { z } from "zod";
import { ApiExtension } from "@webiny/project/extensions/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { defineExtension } from "@webiny/project/extensions/index.js";
import { OBJECT_STORAGE_BUILD_PARAM } from "@webiny/api-object-storage";
import { DISK_OBJECT_STORAGE } from "./abstractions.js";

const paramsSchema = z.object({
    path: z.string().describe("Absolute path of the folder objects are stored in.")
});

/**
 * Keeps a standalone project's objects (uploaded files and the like) in a folder on disk. Projects
 * don't add it themselves: `<Infra.FileStorage.Disk path="..." />` renders it.
 *
 * The folder becomes the `WEBINY_LOCAL_STORAGE_PATH` env var for `webiny watch` and `webiny serve`.
 * Nothing is baked into the build: a deployed container sets it itself, and the API reads it when it
 * starts.
 */
export const DiskStorage = defineExtension({
    type: "Infra/ObjectStorage/Disk",
    tags: { runtimeContext: "project", hosting: "standalone" },
    description: "Keep uploaded files and other objects in a folder on disk.",
    paramsSchema,
    render(params) {
        return (
            <>
                <ApiExtension
                    src={import.meta.dirname + "/DiskStorageExtension.js"}
                    exportName={"DiskStorageExtension"}
                />
                <BuildParam paramName={OBJECT_STORAGE_BUILD_PARAM} value={DISK_OBJECT_STORAGE} />
                <EnvVar varName="WEBINY_LOCAL_STORAGE_PATH" value={params.path} />
            </>
        );
    }
});
