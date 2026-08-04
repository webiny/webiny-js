interface CreateRunBuildArtifactStepsParams {
    workingDirectory: string;
}

// Passes the build output from the `build` job to the jobs that consume it, using artifacts
// instead of `actions/cache` (see `createRunBuildCacheSteps`).
//
// Why: since GitHub's June 2026 "read-only cache for low-trust triggers" change, workflows
// triggered by `issue_comment` (all of our /alpha, /beta, /e2e and /vitest commands) get a
// read-only cache token. Cache SAVES fail with "cache write denied: token has no writable
// scopes" no matter what `permissions` the job declares, so every consumer job missed the
// cache and rebuilt from scratch. Artifacts are the documented way to pass data between jobs
// and are not subject to that restriction.
//
// Cache-based steps are still correct (and cheaper) on trusted triggers - `push` and
// `pull_request` - so those workflows keep using `createRunBuildCacheSteps`.
//
// The directory is tarred rather than handed to `upload-artifact` as-is: it is ~168 MB across
// ~44k files, which compresses to ~12 MB as a single zstd tarball. Uploading and downloading
// one small file beats zipping 44k files once and unzipping them in every consumer job.
// `zstdmt` is what `actions/cache` itself shells out to, so it is present on both the hosted
// and self-hosted runners. GNU tar appends `-d` when extracting, so the same program works
// both ways.
const ARCHIVE = "run-build-cache.tzst";

// Artifacts are already scoped to a single workflow run, so the attempt number is all that is
// needed to keep re-runs from colliding with the previous attempt's upload.
const ARTIFACT_NAME = "run-build-cache-${{ github.run_attempt }}";

const CACHED_PACKAGES = ".webiny/cached-packages";

export const createRunBuildArtifactUploadSteps = (params: CreateRunBuildArtifactStepsParams) => {
    return [
        {
            name: "Compress build cache",
            run: `tar -cf ${ARCHIVE} --use-compress-program=zstdmt -C ${params.workingDirectory} ${CACHED_PACKAGES}`
        },
        {
            name: "Upload build cache",
            uses: "actions/upload-artifact@v7",
            with: {
                name: ARTIFACT_NAME,
                path: ARCHIVE,
                "retention-days": 1,
                // The tarball is already zstd-compressed; re-deflating it only burns CPU.
                "compression-level": 0,
                "if-no-files-found": "error"
            }
        }
    ] as const;
};

export const createRunBuildArtifactDownloadSteps = (params: CreateRunBuildArtifactStepsParams) => {
    return [
        {
            name: "Download build cache",
            uses: "actions/download-artifact@v8",
            with: { name: ARTIFACT_NAME }
        },
        {
            name: "Extract build cache",
            run: `tar -xf ${ARCHIVE} --use-compress-program=zstdmt -C ${params.workingDirectory}`
        }
    ] as const;
};
