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
    /**
     * Full access configuration.
     * - `true` — emits `{ name: "${prefix}.*" }`.
     * - `{ ...extras }` — emits `{ name: "${prefix}.*", ...extras }`.
     */
    fullAccess: boolean | { [key: string]: any };
    /**
     * Read-only access configuration. When defined, the schema supports a read-only tier.
     * - `true` — emits `{ name: "${prefix}.*", rwd: "r" }`.
     * - `Permission[]` — emits the array as-is.
     */
    readOnlyAccess?: boolean | Permission[];
    /** Entity definitions (optional — simple apps have none) */
    entities?: EntityDefinition[];
}

/**
 * A compiled permission schema returned by `createPermissionSchema`.
 */
export interface PermissionSchema {
    prefix: string;
    /**
     * Full access configuration.
     * - `true` — emits `{ name: "${prefix}.*" }`.
     * - `{ ...extras }` — emits `{ name: "${prefix}.*", ...extras }`.
     */
    fullAccess: boolean | { [key: string]: any };
    /**
     * Read-only access configuration. When defined, the schema supports a read-only tier.
     * - `true` — emits `{ name: "${prefix}.*", rwd: "r" }`.
     * - `Permission[]` — emits the array as-is.
     */
    readOnlyAccess?: boolean | Permission[];
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

/**
 * Item that may have an owner (used for own-scope permission checks).
 */
export interface OwnableItem {
    createdBy?: { id: string } | null;
}

/**
 * Extract the union of entity definitions from a schema config type.
 */
type EntitiesOf<S extends PermissionSchemaConfig> = S extends {
    entities: ReadonlyArray<infer E extends EntityDefinition>;
}
    ? E
    : never;

/**
 * Extract entity IDs whose actions array contains an action with the given name.
 */
type EntityIdWithAction<S extends PermissionSchemaConfig, A extends string> = {
    [K in EntitiesOf<S> as K extends { actions: ReadonlyArray<infer Act> }
        ? Act extends { name: A }
            ? K["id"]
            : never
        : never]: never;
} extends infer M
    ? keyof M & string
    : never;

/**
 * Entity IDs that have the "rwd" action.
 */
export type RwdEntityId<S extends PermissionSchemaConfig> = EntityIdWithAction<S, "rwd">;

/**
 * Entity IDs that have the "pw" action.
 */
export type PwEntityId<S extends PermissionSchemaConfig> = EntityIdWithAction<S, "pw">;

/**
 * All entity IDs in the schema.
 */
export type AllEntityIds<S extends PermissionSchemaConfig> = EntitiesOf<S>["id"];

/**
 * Custom (non-builtin) action names across all entities.
 */
export type CustomActionNames<S extends PermissionSchemaConfig> = Exclude<
    EntitiesOf<S> extends { actions: ReadonlyArray<infer Act extends ActionDefinition> }
        ? Act["name"]
        : never,
    "rwd" | "pw"
>;

/**
 * The return type of `usePermissions(schema)`.
 *
 * When the schema has literal entity types, methods are narrowed to only accept valid entity IDs.
 * When the schema is dynamically typed, all methods accept `string`.
 */
export type UsePermissionsResult<S extends PermissionSchemaConfig> =
    string extends AllEntityIds<S> ? UsePermissionsResultUntyped : UsePermissionsResultTyped<S>;

export interface UsePermissionsResultUntyped {
    canAccess: (entityId: string) => boolean;
    canRead: (entityId: string) => boolean;
    canCreate: (entityId: string) => boolean;
    canEdit: (entityId: string, item?: OwnableItem) => boolean;
    canDelete: (entityId: string, item?: OwnableItem) => boolean;
    canPublish: (entityId: string) => boolean;
    canUnpublish: (entityId: string) => boolean;
    canAction: (action: string, entityId: string) => boolean;
}

/**
 * Action values accepted by `HasPermission`.
 *
 * Built-in actions are always available; custom action names from the schema are inferred automatically.
 */
export type HasPermissionAction<S extends PermissionSchemaConfig> =
    | "read"
    | "create"
    | "edit"
    | "delete"
    | "publish"
    | "unpublish"
    | CustomActionNames<S>;

/**
 * Props for a schema-bound `HasPermission` component created via `createHasPermission`.
 *
 * Exactly one of `entity`, `any`, or `all` must be provided.
 */
export type HasPermissionProps<S extends PermissionSchemaConfig> =
    | SingleEntityProps<S>
    | AnyEntitiesProps<S>
    | AllEntitiesProps<S>;

interface SingleEntityProps<S extends PermissionSchemaConfig> {
    entity: AllEntityIds<S>;
    any?: never;
    all?: never;
    action?: HasPermissionAction<S>;
    children: React.ReactNode;
}

interface AnyEntitiesProps<S extends PermissionSchemaConfig> {
    entity?: never;
    any: AllEntityIds<S>[];
    all?: never;
    action?: HasPermissionAction<S>;
    children: React.ReactNode;
}

interface AllEntitiesProps<S extends PermissionSchemaConfig> {
    entity?: never;
    any?: never;
    all: AllEntityIds<S>[];
    action?: HasPermissionAction<S>;
    children: React.ReactNode;
}

type UsePermissionsResultTyped<S extends PermissionSchemaConfig> = {
    canAccess: (entityId: AllEntityIds<S>) => boolean;
    canAction: (
        action: CustomActionNames<S> extends never ? string : CustomActionNames<S>,
        entityId: AllEntityIds<S>
    ) => boolean;
} & ([RwdEntityId<S>] extends [never]
    ? {
          canRead: (entityId: string) => boolean;
          canCreate: (entityId: string) => boolean;
          canEdit: (entityId: string, item?: OwnableItem) => boolean;
          canDelete: (entityId: string, item?: OwnableItem) => boolean;
      }
    : {
          canRead: (entityId: RwdEntityId<S>) => boolean;
          canCreate: (entityId: RwdEntityId<S>) => boolean;
          canEdit: (entityId: RwdEntityId<S>, item?: OwnableItem) => boolean;
          canDelete: (entityId: RwdEntityId<S>, item?: OwnableItem) => boolean;
      }) &
    ([PwEntityId<S>] extends [never]
        ? {
              canPublish: (entityId: string) => boolean;
              canUnpublish: (entityId: string) => boolean;
          }
        : {
              canPublish: (entityId: PwEntityId<S>) => boolean;
              canUnpublish: (entityId: PwEntityId<S>) => boolean;
          });
