import { createHandler } from "@webiny/handler";
import awsDocumentDbProxy from "@webiny/handler-aws-documentdb-proxy";

export const handler = createHandler(
    awsDocumentDbProxy({
        logCollection: process.env.LOG_COLLECTION,
        server: process.env.DOCUMENT_DB_SERVER,
        username: process.env.DOCUMENT_DB_USERNAME,
        password: process.env.DOCUMENT_DB_PASSWORD,
        database: process.env.DOCUMENT_DB_DATABASE
    })
);
