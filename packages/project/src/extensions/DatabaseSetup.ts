import { z } from "zod";
import { defineExtension } from "../defineExtension/index.js";

export const DatabaseSetup = defineExtension({
    type: "Project/DatabaseSetup",
    tags: { runtimeContext: "project", hosting: "all" },
    description: "Define the database setup configuration (ddb, ddb+es, ddb+os or pg).",
    paramsSchema: z.object({
        setupName: z
            .enum(["ddb", "ddb+es", "ddb+os", "pg"])
            .describe(
                "The database setup type: ddb (DynamoDB only), ddb+es (DynamoDB + ElasticSearch), ddb+os (DynamoDB + OpenSearch), or pg (PostgreSQL)"
            )
    })
});
