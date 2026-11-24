import React from "react";
import { z } from "zod";
import { ApiExtension } from "@webiny/project/extensions/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { defineExtension } from "@webiny/project/extensions/index.js";
import { OBJECT_STORAGE_BUILD_PARAM } from "@webiny/api-object-storage";
import { S3_OBJECT_STORAGE } from "./abstractions.js";

export const s3StorageParamsSchema = z.object({
    bucket: z.string().describe("Name of the bucket uploaded files are stored in."),
    region: z
        .string()
        .optional()
        .describe('Region of the bucket. "auto" for Cloudflare R2. Defaults to AWS_REGION.'),
    endpoint: z
        .string()
        .optional()
        .describe(
            "Endpoint of an S3-compatible service (R2, Backblaze B2, Garage, SeaweedFS...). Unset for AWS S3."
        ),
    forcePathStyle: z
        .boolean()
        .optional()
        .describe("Put the bucket name in the path; most self-hosted services need it."),
    prefix: z
        .string()
        .optional()
        .describe("Prefix for every key, so one bucket can hold more than one project."),
    accessKeyId: z
        .string()
        .optional()
        .describe("Access key ID. Unset to use the AWS SDK's default credentials (e.g. a role)."),
    secretAccessKey: z.string().optional().describe("Secret access key, set with accessKeyId.")
});

interface OptionalEnvVarProps {
    varName: string;
    value: string | undefined;
}

const OptionalEnvVar = ({ varName, value }: OptionalEnvVarProps) => {
    if (value === undefined) {
        return null;
    }
    return <EnvVar varName={varName} value={value} />;
};

/**
 * Keeps a standalone project's objects (uploaded files and the like) in an S3-compatible bucket
 * instead of a folder on disk, so any number of API processes on any number of machines share them.
 * Projects don't add it themselves: `<Infra.FileStorage.S3 bucket="..." />` renders it.
 *
 * The settings become `WEBINY_S3_*` env vars for `webiny watch` and `webiny serve`. Nothing is baked
 * into the build: a deployed container sets them itself, and the API reads them when it starts.
 */
export const S3Storage = defineExtension({
    type: "Infra/ObjectStorage/S3",
    tags: { runtimeContext: "project", hosting: "standalone" },
    description:
        "Keep uploaded files and other objects in an S3-compatible bucket instead of a folder on disk.",
    paramsSchema: s3StorageParamsSchema,
    render(params) {
        let forcePathStyle: string | undefined;
        if (params.forcePathStyle !== undefined) {
            forcePathStyle = String(params.forcePathStyle);
        }

        return (
            <>
                <ApiExtension
                    src={import.meta.dirname + "/S3StorageExtension.js"}
                    exportName={"S3StorageExtension"}
                />
                <BuildParam paramName={OBJECT_STORAGE_BUILD_PARAM} value={S3_OBJECT_STORAGE} />
                <EnvVar varName="WEBINY_S3_BUCKET" value={params.bucket} />
                <OptionalEnvVar varName="WEBINY_S3_REGION" value={params.region} />
                <OptionalEnvVar varName="WEBINY_S3_ENDPOINT" value={params.endpoint} />
                <OptionalEnvVar varName="WEBINY_S3_FORCE_PATH_STYLE" value={forcePathStyle} />
                <OptionalEnvVar varName="WEBINY_S3_PREFIX" value={params.prefix} />
                <OptionalEnvVar varName="WEBINY_S3_ACCESS_KEY_ID" value={params.accessKeyId} />
                <OptionalEnvVar
                    varName="WEBINY_S3_SECRET_ACCESS_KEY"
                    value={params.secretAccessKey}
                />
            </>
        );
    }
});
