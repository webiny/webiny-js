import type React from "react";

/**
 * A single permission object from the API.
 */
export interface Permission {
    name: string;
    [key: string]: any;
}

/**
 * An action definition on an entity.
 *
 * Built-in actions:
 * - `{ name: "rwd" }` — read/write/delete single-select (serialized as joined string, e.g. "rw")
 * - `{ name: "pw" }` — publish/unpublish multi-select (serialized as joined string, e.g. "pu")
 *
 * Custom actions:
 * - `{ name: "install", label: "Install" }` — boolean flag (serialized as `install: true`)
 */
export interface ActionDefinition {
    /** Key on the permission object (e.g. "rwd", "pw", "install") */
    name: string;
    /** Display label for the UI. Required for custom actions; ignored for built-in "rwd"/"pw". */
    label?: string;
}

/**
 * Defines an entity within a permission schema.
 */
export interface EntityDefinition {
    /** Unique ID, used for form field naming: ${id}AccessScope, ${id}RWD, etc. */
    id: string;
    /** Display title for the UI renderer (e.g. "Files", "Settings") */
    title?: string;
    /** Permission name emitted for this entity (e.g. "fm.file") */
    permission: string;
    /** Available access scopes */
    scopes: ("full" | "own")[];
    /** Action definitions for this entity */
    actions?: ActionDefinition[];
    /** Dependency on another entity */
    dependsOn?: {
        /** ID of parent entity */
        entity: string;
        /** Required action character (e.g. "r") */
        requires: string;
    };
}

/**
 * Configuration for creating a permission schema.
 */
export interface PermissionSchemaConfig {
    /** Permission prefix — used to filter permissions from the array */
    prefix: string;
    /** Permission object emitted on "full access". All properties are spread onto the permission. */
    fullAccess: { name: string; [key: string]: any };
    /** Entity definitions (optional — simple apps have none) */
    entities?: EntityDefinition[];
}

/**
 * A compiled permission schema returned by `createPermissionSchema`.
 */
export interface PermissionSchema {
    prefix: string;
    /** Permission object emitted on "full access". All properties are spread onto the permission. */
    fullAccess: { name: string; [key: string]: any };
    entities?: EntityDefinition[];
}

/**
 * Options passed to the `usePermissionForm` hook.
 */
export interface UsePermissionFormOptions {
    value: Permission[];
    onChange: (value: Permission[]) => void;
    /** Merge extra fields into deserialized form data (for CMS endpoints, resource scopes, etc.) */
    deserialize?: (permissions: Permission[]) => Record<string, any>;
    /** Transform or extend the core-serialized permissions (for CMS endpoints, resource scopes, etc.) */
    serialize?: (formData: Record<string, any>, corePermissions: Permission[]) => Permission[];
}

/**
 * Return value of `usePermissionForm`.
 */
export interface UsePermissionFormResult {
    formData: Record<string, any>;
    onFormChange: (data: Record<string, any>) => void;
}

/**
 * Configuration for a permission renderer registered via AdminConfig.
 *
 * Either `schema` or `element` must be provided:
 * - `schema`: uses the built-in PermissionRenderer for auto-generated UI.
 * - `element`: uses a custom React element for full control.
 */
export type PermissionRendererConfig = PermissionRendererConfigBase &
    (
        | { schema: PermissionSchema; element?: never }
        | { schema?: never; element: React.ReactElement }
    );

interface PermissionRendererConfigBase {
    name: string;
    title: string;
    description?: string;
    icon?: React.ReactElement;
    system?: boolean;
}
