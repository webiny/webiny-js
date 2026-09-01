import type { WbIdentity, WbLive, WbLocation, WbPageSystem } from "~/types.js";
import { ROOT_FOLDER, WbPageStatus, type WbStatus } from "~/constants.js";

export interface PageData {
    id?: string;
    entryId?: string;
    status?: WbStatus;
    version?: number;
    location?: WbLocation;
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
    bindings?: Record<string, any>;
    elements?: Record<string, any>;
    extensions?: Record<string, any>;
    createdBy?: WbIdentity;
    createdOn?: string;
    savedBy?: WbIdentity;
    savedOn?: string;
    modifiedBy?: WbIdentity | null;
    modifiedOn?: string | null;
    system?: WbPageSystem | null;
    live?: WbLive | null;
    revisionDescription?: string;
}

export class Page {
    public id: string;
    public entryId: string;
    public status: WbStatus;
    public version: number;
    public location: WbLocation;
    public properties: Record<string, any>;
    public metadata: Record<string, any>;
    public bindings: Record<string, any>;
    public elements: Record<string, any>;
    public extensions: Record<string, any>;
    public createdBy: WbIdentity;
    public createdOn: string;
    public savedBy: WbIdentity;
    public savedOn: string;
    public modifiedBy: WbIdentity;
    public modifiedOn: string;
    public system: WbPageSystem | null;
    public live: WbLive | null = null;
    public revisionDescription?: string | undefined;

    protected constructor(data: PageData) {
        this.id = data.id ?? "";
        this.entryId = data.entryId ?? "";
        this.status = data.status ?? WbPageStatus.Draft;
        this.version = data.version ?? 1;
        this.location = this.createLocation(data);
        this.properties = data.properties ?? {};
        this.metadata = data.metadata ?? {};
        this.bindings = data.bindings ?? {};
        this.elements = data.elements ?? {};
        this.extensions = data.extensions ?? {};
        this.createdBy = this.createIdentity(data.createdBy);
        this.createdOn = data.createdOn ?? "";
        this.savedBy = this.createIdentity(data.savedBy);
        this.savedOn = data.savedOn ?? "";
        this.modifiedBy = this.createIdentity(data.modifiedBy);
        this.modifiedOn = data.modifiedOn ?? "";
        this.system = data.system || null;
        this.live = data.live || null;
        this.revisionDescription = data.revisionDescription;
    }

    static create(data: PageData) {
        return new Page(data);
    }

    private createLocation(data: PageData): WbLocation {
        if (data.location) {
            return {
                folderId: data.location.folderId
            };
        }

        return {
            folderId: ROOT_FOLDER
        };
    }

    private createIdentity(identity?: WbIdentity | null): WbIdentity {
        return {
            id: identity?.id || "",
            displayName: identity?.displayName || "",
            type: identity?.type || ""
        };
    }
}
