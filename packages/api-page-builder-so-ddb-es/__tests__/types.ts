import { Page } from "@webiny/api-page-builder/types";
import { PbCreatePayload, PbUpdatePayload } from "@webiny/api-page-builder-aco/types";

export interface CustomFieldsPbCreatePayload extends PbCreatePayload {
    data: PbCreatePayload["data"] & {
        customViews: number;
    };
}

export interface CustomFieldsPbUpdatePayload extends PbUpdatePayload {
    data: PbCreatePayload["data"] & {
        customViews: number;
    };
}

export interface CustomFieldsPage extends Page {
    customViews: number;
}
