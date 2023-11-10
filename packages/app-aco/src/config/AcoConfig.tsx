import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Folder, FolderConfig } from "./folder";

export { ActionConfig as FolderActionConfig } from "./folder/Action";

const base = createConfigurableComponent<AcoConfig>("AcoConfig");

export const AcoConfig = Object.assign(base.Config, { Folder });
export const AcoWithConfig = base.WithConfig;

interface AcoConfig {
    folder: FolderConfig;
}

export function useAcoConfig() {
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
