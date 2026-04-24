import { z } from "zod";
import { defineExtension } from "../defineExtension/index.js";

export const ProjectId = defineExtension({
    type: "Project/ProjectId",
    tags: { runtimeContext: "project" },
    description: "An extension for defining the project ID.",
    paramsSchema: z.object({
        id: z.string().refine(
            value => {
                // Allow only alphanumeric characters, dashes, underscores, no spaces, and forward slashes.
                return /^[a-zA-Z0-9-_/]+$/.test(value);
            },
            {
                message:
                    "Project ID can only contain alphanumeric characters, dashes, underscores, and forward slashes."
            }
        )
    })
});
