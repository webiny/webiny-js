export interface Action {
    type: string;
    displayName: string;
    /**
     * Delay in seconds before a new audit log can be created.
     * During this delay actions will update existing audit log instead of creating new ones.
     */
    newEntryDelay?: number;
}

export interface Entity {
    type: string;
    displayName: string;
    linkToEntity?: (id: string) => string;
    actions: Action[];
}

export interface App {
    app: string;
    displayName: string;
    entities: Entity[];
}
