import type { ReactElement } from "react";
import type React from "react";
import type { Plugin } from "@webiny/plugins/types.js";
import type { ApolloClient } from "apollo-client";
import type { SecurityPermission } from "@webiny/app-security/types.js";

export type { Icon } from "~/components/IconPicker/types.js";

export interface AdminInstallationPluginRenderParams {
    onInstalled: () => Promise<void>;
}

export type AdminInstallationPlugin = Plugin & {
    type: "admin-installation";
    getInstalledVersion(params: { client: ApolloClient<object> }): Promise<string | null>;
    title: string;
    dependencies?: string[];
    secure: boolean;
    render(params: AdminInstallationPluginRenderParams): React.ReactNode;
};

export type AdminAppPermissionRendererPlugin = Plugin & {
    type: "admin-app-permissions-renderer";
    system?: boolean;
    render(params: any): ReactElement;
};

/**
 * Represents a file as we receive from the GraphQL API.
 */
export interface FileItem {
    id: string;
    name: string;
    key: string;
    src: string;
    size: number;
    type: string;
    tags: string[];
    createdOn: string;
    createdBy: {
        id: string;
        displayName: string;
    };
    savedOn: string;
    savedBy: {
        id: string;
        displayName: string;
    };
    modifiedOn: string;
    modifiedBy: {
        id: string;
        displayName: string;
    };
    location: {
        folderId: string;
    };
    meta?: {
        private?: boolean;
        width?: number;
        height?: number;
    };
    accessControl?: {
        type: "public" | "private-authenticated";
    };
    extensions?: Record<string, any>;
}

export interface FileManagerSecurityPermission extends SecurityPermission {
    rwd?: string;
    own?: boolean;
}

export type ComponentWithChildren = React.ComponentType<{ children?: React.ReactNode }>;
