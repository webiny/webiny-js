import React from "react";
import nodePath from "node:path";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { EnvVar } from "@webiny/project/extensions/EnvVar.js";

const s3Schema = z.object({
    bucket: z.string().describe("Name of the bucket uploaded files are stored in."),
    region: z
        .string()
        .optional()
        .describe('Region of the bucket. "auto" for Cloudflare R2. Defaults to AWS_REGION.'),
    endpoint: z
        .string()
        .optional()
        .describe(
            "Endpoint of an S3-compatible service (R2, MinIO, Garage, Backblaze B2...). Unset for AWS S3."
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

type S3Params = z.infer<typeof s3Schema>;

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

interface S3EnvVarsProps {
    s3: S3Params;
}

const S3EnvVars = ({ s3 }: S3EnvVarsProps) => {
    let forcePathStyle: string | undefined;
    if (s3.forcePathStyle !== undefined) {
        forcePathStyle = String(s3.forcePathStyle);
    }

    return (
        <>
            <EnvVar varName="WEBINY_S3_BUCKET" value={s3.bucket} />
            <OptionalEnvVar varName="WEBINY_S3_REGION" value={s3.region} />
            <OptionalEnvVar varName="WEBINY_S3_ENDPOINT" value={s3.endpoint} />
            <OptionalEnvVar varName="WEBINY_S3_FORCE_PATH_STYLE" value={forcePathStyle} />
            <OptionalEnvVar varName="WEBINY_S3_PREFIX" value={s3.prefix} />
            <OptionalEnvVar varName="WEBINY_S3_ACCESS_KEY_ID" value={s3.accessKeyId} />
            <OptionalEnvVar varName="WEBINY_S3_SECRET_ACCESS_KEY" value={s3.secretAccessKey} />
        </>
    );
};

/**
 * Configure where the standalone hosting type keeps uploaded files, and the upload secret.
 *
 * `path` keeps them in a folder on disk (`WEBINY_LOCAL_STORAGE_PATH`); that only works when every API
 * process runs on one machine. `s3` keeps them in an S3-compatible bucket (`WEBINY_S3_*`), which any
 * number of API processes on any number of machines can share. Exactly one of the two is set.
 * `uploadSecret` (`WEBINY_UPLOAD_SECRET`) signs upload tokens.
 *
 * The env vars are set for `webiny watch` and `webiny serve`, which pass them to the API server. The
 * API reads them at startup (`readStandaloneConfig`) and refuses to start without them. Nothing is
 * baked into the build: a deployed container sets them itself.
 *
 * A relative storage path is resolved against the project root (not the disposable app workspace), so
 * uploaded files survive rebuilds — same rule as `Infra.Sqlite`.
 *
 * AWS hosting-type counterpart concept: the S3 bucket (`ApiFileManager`).
 */
export const FileStorage = defineExtension({
    type: "Infra/FileStorage",
    tags: { runtimeContext: "project", hosting: "standalone" },
    description:
        "Configure where the standalone hosting type keeps uploaded files (a folder or an S3-compatible bucket) and the upload secret.",
    paramsSchema: z
        .object({
            path: z
                .string()
                .optional()
                .describe(
                    "Path to the local file storage directory (absolute, or relative to the project root)."
                ),
            s3: s3Schema.optional().describe("An S3-compatible bucket to store files in."),
            uploadSecret: z.string().describe("Secret string used to sign file upload tokens.")
        })
        .refine(params => !!params.path !== !!params.s3, {
            message: "Set either `path` or `s3`, not both."
        }),
    render({ path: storagePathParam, s3, uploadSecret }) {
        if (s3) {
            return (
                <>
                    <S3EnvVars s3={s3} />
                    <EnvVar varName="WEBINY_UPLOAD_SECRET" value={uploadSecret} />
                </>
            );
        }

        const pathParam = storagePathParam as string;
        let storagePath = pathParam;
        if (!nodePath.isAbsolute(pathParam)) {
            storagePath = nodePath.join(process.cwd(), pathParam);
        }

        return (
            <>
                <EnvVar varName="WEBINY_LOCAL_STORAGE_PATH" value={storagePath} />
                <EnvVar varName="WEBINY_UPLOAD_SECRET" value={uploadSecret} />
            </>
        );
    }
});
