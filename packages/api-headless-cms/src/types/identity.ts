/**
 * An interface describing the reference to a user that created some data in the database.
 *
 * @category General
 */
export interface CmsIdentity {
    /**
     * ID if the user.
     */
    id: string;
    /**
     * Full name of the user.
     */
    displayName: string | null;
    /**
     * Type of the user (admin, user)
     */
    type: string;
}
