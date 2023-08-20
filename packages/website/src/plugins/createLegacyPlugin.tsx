import React from "react";
import type { Plugin } from "@webiny/plugins/types";

export function createLegacyPlugin<TProps, TPlugin = {}>(
    create: (props: TProps) => Plugin<TPlugin>
): React.VFC<TProps> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const LegacyPlugin = (props: TProps) => {
        return null;
    };

    LegacyPlugin.createLegacyPlugin = create;
    LegacyPlugin.displayName = 'OPA_DELA';

    return LegacyPlugin;
}
