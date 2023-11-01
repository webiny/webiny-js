// 5.35.0
import { FileManager_5_35_0_001 } from "./migrations/5.35.0/001/ddb-es";
import { PageBuilder_5_35_0_002 } from "~/migrations/5.35.0/002";
import { AdminUsers_5_35_0_003 } from "~/migrations/5.35.0/003";
import { Tenancy_5_35_0_004 } from "~/migrations/5.35.0/004";
import { CmsModels_5_35_0_005 } from "~/migrations/5.35.0/005";
import { AcoRecords_5_35_0_006 } from "~/migrations/5.35.0/006/ddb-es";
// 5.36.0
import { AcoRecords_5_36_0_001 } from "~/migrations/5.36.0/001/ddb-es";
// 5.37.0
import { TenantLinkRecords_5_37_0_001 } from "~/migrations/5.37.0/001";
import { CmsEntriesRootFolder_5_37_0_002 } from "~/migrations/5.37.0/002/ddb-es";
import { AcoFolders_5_37_0_003 } from "~/migrations/5.37.0/003/ddb-es";
import { AcoRecords_5_37_0_004 } from "~/migrations/5.37.0/004/ddb-es";
import { FileManager_5_37_0_005 } from "~/migrations/5.37.0/005/ddb-es";
import { MultiStepForms_5_38_0_001 } from "~/migrations/5.38.0/001/ddb-es";
import { MultiStepForms_5_38_0_002 } from "~/migrations/5.38.0/002/ddb-es";

export const migrations = () => {
    return [
        FileManager_5_35_0_001,
        PageBuilder_5_35_0_002,
        AdminUsers_5_35_0_003,
        Tenancy_5_35_0_004,
        CmsModels_5_35_0_005,
        AcoRecords_5_35_0_006,
        AcoRecords_5_36_0_001,
        TenantLinkRecords_5_37_0_001,
        CmsEntriesRootFolder_5_37_0_002,
        AcoFolders_5_37_0_003,
        AcoRecords_5_37_0_004,
        FileManager_5_37_0_005,
        MultiStepForms_5_38_0_001,
        MultiStepForms_5_38_0_002
    ];
};
