// 5.35.0
import { FileManager_5_35_0_001 } from "./migrations/5.35.0/001/ddb";
import { PageBuilder_5_35_0_002 } from "~/migrations/5.35.0/002";
import { AdminUsers_5_35_0_003 } from "~/migrations/5.35.0/003";
import { Tenancy_5_35_0_004 } from "~/migrations/5.35.0/004";
import { CmsModels_5_35_0_005 } from "~/migrations/5.35.0/005";
import { AcoRecords_5_35_0_006 } from "~/migrations/5.35.0/006/ddb";
// 5.36.0
import { AcoRecords_5_36_0_001 } from "~/migrations/5.36.0/001/ddb";
// 5.37.0
import { TenantLinkRecords_5_37_0_001 } from "~/migrations/5.37.0/001";
import { CmsEntriesRootFolder_5_37_0_002 } from "~/migrations/5.37.0/002/ddb";
import { AcoFolders_5_37_0_003 } from "~/migrations/5.37.0/003/ddb";
import { AcoRecords_5_37_0_004 } from "~/migrations/5.37.0/004/ddb";
import { FileManager_5_37_0_005 } from "~/migrations/5.37.0/005/ddb";
// 5.38.0
import { MultiStepForms_5_38_0_001 } from "~/migrations/5.38.0/001/ddb";
import { MultiStepForms_5_38_0_002 } from "~/migrations/5.38.0/002/ddb";
import { PageBlocks_5_38_0_003 } from "~/migrations/5.38.0/003/ddb";
// 5.39.0
import { CmsEntriesInitNewMetaFields_5_39_0_001 } from "~/migrations/5.39.0/001/ddb";
import { FileManager_5_39_0_002 } from "~/migrations/5.39.0/002/ddb";
// 5.40.0
import { FormBuilder_5_40_0_001 } from "~/migrations/5.40.0/001/ddb";
import { FormBuilder_5_40_0_002 } from "~/migrations/5.40.0/002/ddb";

export const migrations = () => {
    return [
        // 5.35.0
        FileManager_5_35_0_001,
        PageBuilder_5_35_0_002,
        AdminUsers_5_35_0_003,
        Tenancy_5_35_0_004,
        CmsModels_5_35_0_005,
        AcoRecords_5_35_0_006,
        // 5.36.0
        AcoRecords_5_36_0_001,
        // 5.37.0
        TenantLinkRecords_5_37_0_001,
        CmsEntriesRootFolder_5_37_0_002,
        AcoFolders_5_37_0_003,
        AcoRecords_5_37_0_004,
        FileManager_5_37_0_005,
        // 5.38.0
        MultiStepForms_5_38_0_001,
        MultiStepForms_5_38_0_002,
        PageBlocks_5_38_0_003,
        // 5.39.0
        CmsEntriesInitNewMetaFields_5_39_0_001,
        FileManager_5_39_0_002,
        // 5.40.0
        FormBuilder_5_40_0_001,
        FormBuilder_5_40_0_002
    ];
};
