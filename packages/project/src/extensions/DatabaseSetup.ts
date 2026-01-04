import { z } from "zod";
import { defineExtension } from "../defineExtension/index.js";

export const DatabaseSetup = defineExtension({
    type: "Project/DatabaseSetup",
    tags: { runtimeContext: "project" },
    description: "Define the database setup configuration (ddb, ddb+es, or ddb+os).",
    multiple: false,
    paramsSchema: z.object({
        setupName: z
            .enum(["ddb", "ddb+es", "ddb+os"])
            .describe(
                "The database setup type: ddb (DynamoDB only), ddb+es (DynamoDB + ElasticSearch), or ddb+os (DynamoDB + OpenSearch)"
            )
    })
});
