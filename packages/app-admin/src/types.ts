import type { ReactElement } from "react";
import type { Plugin } from "@webiny/plugins/types.js";
import { Identity } from "~/domain/Identity.js";

export type { Icon } from "~/components/IconPicker/types.js";

export type AdminAppPermissionRendererPlugin = Plugin & {
    type: "admin-app-permissions-renderer";
    system?: boolean;
    render(params: any): ReactElement;
};

export interface FileManagerSecurityPermission extends Identity.Permission {
    rwd?: string;
    own?: boolean;
}

export type ComponentWithChildren = React.ComponentType<{ children?: React.ReactNode }>;
