/**
 * The timeline's own view of a record, independent of the GraphQL document that fetched it.
 *
 * Everything in `src/timeline/` is pure and has no React in it. That separation is not decorative:
 * a design handover is going to replace layout, hierarchy and interaction wholesale, and it must
 * not have to reimplement grouping, collapsing, path rendering or state derivation to do it. If
 * any of that lived in a component, the design pass would be a rewrite.
 */

export interface TimelineActor {
    id: string;
    type: string;
    displayName: string;
}

export interface TimelineChange {
    path: string;
    label: string;
    operation?: string | null;
}

export interface TimelineSubject {
    id: string;
    label: string;
}

export interface TimelineRecord {
    id: string;
    targetType: string;
    targetId: string;
    revision: string;
    timestamp: string;
    actor: TimelineActor;
    action: string;
    source: string;
    correlationId: string;
    changeset: TimelineChange[];
    truncated: boolean;
    subject?: TimelineSubject | null;
    hasNote?: boolean | null;
}

/** An actor whose identity the reader may not see, redacted server-side. */
export const isRedactedActor = (actor: TimelineActor): boolean => {
    return actor.id === "";
};
