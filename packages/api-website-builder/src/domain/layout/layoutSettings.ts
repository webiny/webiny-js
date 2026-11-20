/**
 * The layout settings of a tenant.
 */
export interface LayoutSettings {
    // The entry id of the published source layout new pages get, when created without picking one.
    defaultLayout: string | null;
}
