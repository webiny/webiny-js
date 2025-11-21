import type { FileManagerContext } from "~/types.js";
import { decorateContext } from "@webiny/api";

// TODO: implement this via a use case decorator
export const applyThreatScanning = (context: FileManagerContext["fileManager"]) => {
    return decorateContext(context, {
        createFile: decoratee => (data, meta) => {
            return decoratee(
                {
                    ...data,
                    tags: [...data.tags, "threatScanInProgress"]
                },
                meta
            );
        }
    });
};
