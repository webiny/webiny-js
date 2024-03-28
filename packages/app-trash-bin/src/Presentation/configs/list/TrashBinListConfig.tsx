import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import { Browser, BrowserConfig } from "./Browser";

const base = createConfigurableComponent<TrashBinListConfig>("TrashBinListConfig");

export const TrashBinListConfig = Object.assign(base.Config, { Browser });
export const TrashBinListWithConfig = base.WithConfig;

interface TrashBinListConfig {
    browser: BrowserConfig;
}

export function useTrashBinListConfig() {
    const config = base.useConfig();

    const browser = config.browser || {};

    return useMemo(
        () => ({
            browser: {
                ...browser,
                bulkActions: [...(browser.bulkActions || [])]
            }
        }),
        [config]
    );
}
