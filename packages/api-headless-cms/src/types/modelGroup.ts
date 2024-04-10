import { CmsIdentity } from "./identity";

/**
 * @category Database model
 * @category CmsModel
 */
export interface CmsModelGroup {
    /**
     * Generated ID of the group
     */
    id: string;
    /**
     * Name of the group
     */
    name: string;
}

/**
 * A representation of content model group in the database.
 *
 * @category CmsGroup
 * @category Database model
 */
export interface CmsGroup {
    /**
     * Generated ID.
     */
    id: string;
    /**
     * Name of the group.
     */
    name: string;
    /**
     * Slug for the group. Must be unique.
     */
    slug: string;
    /**
     * Group tenant.
     */
    tenant: string;
    /**
     * Locale this group belongs to.
     */
    locale: string;
    /**
     * Description for the group.
     */
    description: string | null;
    /**
     * Icon for the group. In a form of "ico/ico".
     */
    icon: string;
    /**
     * CreatedBy reference object.
     */
    createdBy?: CmsIdentity;
    /**
     * Date group was created on.
     */
    createdOn?: string;
    /**
     * Date group was created or changed on.
     */
    savedOn?: string;
    /**
     * Which Webiny version was this record stored with.
     */
    webinyVersion: string;
    /**
     * Is group private?
     * This is meant to be used for some internal groups - will not be visible in the schema.
     * Only available for the plugin constructed groups.
     */
    isPrivate?: boolean;
    /**
     * Is this group created via plugin?
     */
    isPlugin?: boolean;
}
