import { mdbid } from "@webiny/utils";

export class TenantId {
    static from(id?: string) {
        return id ?? mdbid();
    }
}
