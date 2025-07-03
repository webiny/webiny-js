import type { WbLocation } from "~/types.js";
import { ROOT_FOLDER, statuses, type WbStatus } from "~/constants.js";

export interface PageData {
    id?: string;
    entryId?: string;
    status?: WbStatus;
    location?: WbLocation;
    wbyAco_location?: WbLocation;
    properties?: Record<string, any>;
    bindings?: Record<string, any>;
    elements?: Record<string, any>;
    extensions?: Record<string, any>;
}

export class Page {
    public id: string;
    public entryId: string;
    public status: WbStatus;
    public location: WbLocation;
    public properties: Record<string, any>;
    public bindings: Record<string, any>;
    public elements: Record<string, any>;
    public extensions: Record<string, any>;

    protected constructor(data: PageData) {
        this.id = data.id ?? "";
        this.entryId = data.entryId ?? "";
        this.status = data.status ?? statuses.draft;
        this.location = this.getLocation(data);
        this.properties = data.properties ?? {};
        this.bindings = data.bindings ?? {};
        this.elements = data.elements ?? {};
        this.extensions = data.extensions ?? {};
    }

    static create(data: PageData) {
        return new Page(data);
    }

    private getLocation(data: PageData): WbLocation {
        if (data.wbyAco_location) {
            return data.wbyAco_location;
        }

        if (data.location) {
            return data.location;
        }

        return {
            folderId: ROOT_FOLDER
        };
    }
}
