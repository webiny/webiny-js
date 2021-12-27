import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createTenancyContext } from "@webiny/api-tenancy";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createSecurityContext } from "@webiny/api-security";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";

export default ({ documentClient }: { documentClient: DocumentClient }) => [
    /**
     * Create Tenancy app in the `context`.
     */
    createTenancyContext({
        storageOperations: tenancyStorageOperations({ documentClient })
    }),

    /**
     * Create Security app in the `context`.
     */
    createSecurityContext({
        storageOperations: securityStorageOperations({ documentClient })
    })
];
