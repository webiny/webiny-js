import { AwsTags } from "@webiny/project-extensions-aws/extensions/index.js";
import { PulumiOpenSearch as OpenSearch } from "@webiny/project-extensions-aws/extensions/index.js";
import { Vpc } from "@webiny/project-extensions-aws/extensions/index.js";
import { AdminCustomDomains } from "@webiny/project-extensions-aws/extensions/index.js";
import { ApiCustomDomains } from "@webiny/project-extensions-aws/extensions/index.js";
import { BlueGreenDeployments } from "@webiny/project-extensions-aws/extensions/index.js";
import { DynamoDbPitr } from "@webiny/project-extensions-aws/extensions/index.js";
import { S3BucketVersioning } from "@webiny/project-extensions-aws/extensions/index.js";
import { CorePulumi } from "./CorePulumi.js";
import { ApiPulumi } from "./ApiPulumi.js";
import { AdminPulumi } from "./AdminPulumi.js";
import { AdminStackOutputValue } from "@webiny/project-extensions-aws/extensions/index.js";
import { ApiStackOutputValue } from "@webiny/project-extensions-aws/extensions/index.js";
import { CoreStackOutputValue } from "@webiny/project-extensions-aws/extensions/index.js";
import { ApiMaxBundleSize } from "@webiny/project-extensions-aws/extensions/index.js";

export { AwsTags };
export { Vpc };
export { OpenSearch };
export { AdminCustomDomains };
export { ApiCustomDomains };
export { BlueGreenDeployments };
export { CorePulumi };
export { ApiPulumi };
export { AdminPulumi };
export { DynamoDbPitr };
export { S3BucketVersioning };

export const definitions = [
    AwsTags.def,
    Vpc.def,
    OpenSearch.def,
    AdminCustomDomains.def,
    ApiCustomDomains.def,
    BlueGreenDeployments.def,
    CorePulumi.def,
    ApiPulumi.def,
    AdminPulumi.def,
    DynamoDbPitr.def,
    S3BucketVersioning.def,
    AdminStackOutputValue.def,
    ApiStackOutputValue.def,
    CoreStackOutputValue.def,
    ApiMaxBundleSize.def
];
