import { FileManager_5_35_0_001 } from "./migrations/5.35.0/001/ddb-es";
import { PageBuilder_5_35_0_002 } from "~/migrations/5.35.0/002";
import { AdminUsers_5_35_0_003 } from "~/migrations/5.35.0/003";
import { Tenancy_5_35_0_004 } from "~/migrations/5.35.0/004";
import { CmsModels_5_35_0_005 } from "~/migrations/5.35.0/005";

export const migrations = () => {
    return [
        FileManager_5_35_0_001,
        PageBuilder_5_35_0_002,
        AdminUsers_5_35_0_003,
        Tenancy_5_35_0_004,
        CmsModels_5_35_0_005
    ];
};
