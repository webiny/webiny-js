/**
 * An action definition on an entity.
 *
 * Built-in actions:
 * - `{ name: "rwd" }` — read/write/delete (serialized as joined string, e.g. "rw")
 * - `{ name: "pw" }` — publish/unpublish (serialized as joined string, e.g. "pu")
 *
 * Custom actions:
 * - `{ name: "install" }` — boolean flag (serialized as `install: true`)
 */
export interface ActionDefinition {
    /** Key on the permission object (e.g. "rwd", "pw", "install"). */
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
    /** Display title for the UI renderer (e.g. "Files", "Settings"). */
    title?: string;
    /** Permission name emitted for this entity (e.g. "fm.file"). */
    permission: string;
    /** Available access scopes. */
    scopes: readonly ("full" | "own")[];
    /** Action definitions for this entity. */
    actions?: readonly ActionDefinition[];
    /** Dependency on another entity. */
    dependsOn?: {
        /** ID of parent entity. */
        entity: string;
        /** Required action character (e.g. "r"). */
        requires: string;
    };
}

/**
 * Configuration for creating a permission schema.
 */
export interface PermissionSchemaConfig {
    /** Permission prefix — used to filter permissions from the array. */
    prefix: string;
    /**
     * Full access configuration.
     * - `true` — emits `{ name: "${prefix}.*" }`.
     * - `{ ...extras }` — emits `{ name: "${prefix}.*", ...extras }`.
     */
    fullAccess: boolean | { [key: string]: any };
    /** Entity definitions (optional — simple apps have none). */
    entities?: readonly EntityDefinition[];
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
 * All entity IDs in the schema.
 */
export type AllEntityIds<S extends PermissionSchemaConfig> = EntitiesOf<S>["id"];

/**
 * Entity IDs that have the "rwd" action.
 */
export type RwdEntityId<S extends PermissionSchemaConfig> = EntityIdWithAction<S, "rwd">;

/**
 * Entity IDs that have the "pw" action.
 */
export type PwEntityId<S extends PermissionSchemaConfig> = EntityIdWithAction<S, "pw">;

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
 * Typed permissions interface for a given schema.
 *
 * When the schema has literal entity types, methods are narrowed to only accept valid entity IDs.
 * When the schema is dynamically typed, all methods accept `string`.
 */
export type Permissions<S extends PermissionSchemaConfig> =
    string extends AllEntityIds<S> ? PermissionsUntyped : PermissionsTyped<S>;

export interface PermissionsUntyped {
    canAccess(entityId: string, item?: OwnableItem): Promise<boolean>;
    onlyOwnRecords(entityId: string): Promise<boolean>;
    canRead(entityId: string): Promise<boolean>;
    canCreate(entityId: string): Promise<boolean>;
    canEdit(entityId: string, item?: OwnableItem): Promise<boolean>;
    canDelete(entityId: string, item?: OwnableItem): Promise<boolean>;
    canPublish(entityId: string): Promise<boolean>;
    canUnpublish(entityId: string): Promise<boolean>;
    canAction(action: string, entityId: string): Promise<boolean>;
}

export type PermissionsTyped<S extends PermissionSchemaConfig> = {
    canAccess(entityId: AllEntityIds<S>, item?: OwnableItem): Promise<boolean>;
    onlyOwnRecords(entityId: AllEntityIds<S>): Promise<boolean>;
    canAction(
        action: CustomActionNames<S> extends never ? string : CustomActionNames<S>,
        entityId: AllEntityIds<S>
    ): Promise<boolean>;
} & ([RwdEntityId<S>] extends [never]
    ? {
          canRead(entityId: string): Promise<boolean>;
          canCreate(entityId: string): Promise<boolean>;
          canEdit(entityId: string, item?: OwnableItem): Promise<boolean>;
          canDelete(entityId: string, item?: OwnableItem): Promise<boolean>;
      }
    : {
          canRead(entityId: RwdEntityId<S>): Promise<boolean>;
          canCreate(entityId: RwdEntityId<S>): Promise<boolean>;
          canEdit(entityId: RwdEntityId<S>, item?: OwnableItem): Promise<boolean>;
          canDelete(entityId: RwdEntityId<S>, item?: OwnableItem): Promise<boolean>;
      }) &
    ([PwEntityId<S>] extends [never]
        ? {
              canPublish(entityId: string): Promise<boolean>;
              canUnpublish(entityId: string): Promise<boolean>;
          }
        : {
              canPublish(entityId: PwEntityId<S>): Promise<boolean>;
              canUnpublish(entityId: PwEntityId<S>): Promise<boolean>;
          });
