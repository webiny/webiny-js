import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Folder, FolderConfig } from "./Folder";

const base = createConfigurableComponent<AcoListConfig>("AcoListConfig");

export const AcoListConfig = Object.assign(base.Config, { Folder });
export const AcoListWithConfig = base.WithConfig;

interface AcoListConfig {
    folder: FolderConfig;
}

export function useAcoListConfig() {
    const config = base.useConfig();

    const folder = config.folder || {};

    return useMemo(
        () => ({
            folder: {
                ...folder,
                actions: [...(folder.actions || [])]
            }
        }),
        [config]
    );
}
