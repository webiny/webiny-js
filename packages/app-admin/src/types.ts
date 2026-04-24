import { Identity } from "~/domain/Identity.js";

export type { Icon } from "~/components/IconPicker/types.js";

export interface FileManagerSecurityPermission extends Identity.Permission {
    rwd?: string;
    own?: boolean;
}

export type ComponentWithChildren = React.ComponentType<{ children?: React.ReactNode }>;
