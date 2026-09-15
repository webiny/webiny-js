import { createAbstraction } from "@webiny/feature/api";

export interface ICollabLocatorResolveParams {
    contentType: string;
    contentId: string;
    locator: string;
}

export interface ICollabLocatorResolution {
    /**
     * Whether the anchor still exists in the current revision of the target content.
     */
    exists: boolean;
    /**
     * Whether the current identity is allowed to read the target content. Thread access
     * equals read access to the target, so resolvers double as the permission gate.
     */
    authorized: boolean;
    /**
     * Human label for the anchor (field display name, block type/name).
     */
    label?: string;
    /**
     * Ancestor labels for display as a breadcrumb (e.g. ["Tab 1", "Field 1"]).
     */
    path?: string[];
    /**
     * Human title of the target content itself (e.g. the CMS entry title). Used by consumers
     * (like notifications) that want to reference the entry rather than the anchored field.
     */
    contentTitle?: string;
}

/**
 * Registered (as a multi-injection) by each content app. The collaboration core treats the
 * `locator` as an opaque string and delegates resolution + read-access checks to the resolver
 * that owns a given `contentType`.
 */
export interface ICollabLocatorResolver {
    // e.g. "cms.entry", "pb.page"
    contentType: string;
    resolve(params: ICollabLocatorResolveParams): Promise<ICollabLocatorResolution>;
}

export const CollabLocatorResolver =
    createAbstraction<ICollabLocatorResolver>("CollabLocatorResolver");

export namespace CollabLocatorResolver {
    export type Interface = ICollabLocatorResolver;
    export type Params = ICollabLocatorResolveParams;
    export type Resolution = ICollabLocatorResolution;
}
