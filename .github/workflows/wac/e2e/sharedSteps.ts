import {
    createGlobalBuildCacheSteps,
    createInstallBuildSteps,
    createRunBuildArtifactDownloadSteps,
    createRunBuildArtifactUploadSteps,
    createYarnCacheSteps
} from "../steps/index.js";
import { DIR_WEBINY_JS } from "./constants.js";

// Step groups shared by every job in the `/e2e` workflow, all bound to the same working directory.
export const installBuildSteps = createInstallBuildSteps({ workingDirectory: DIR_WEBINY_JS });
// Restore-only: the `/e2e` workflow is triggered by `issue_comment`, so its cache token cannot
// write. These step groups are used by that workflow only - `push.yml` builds its own (savable)
// ones and imports just `createServerProjectParts` from here.
export const yarnCacheSteps = createYarnCacheSteps({
    workingDirectory: DIR_WEBINY_JS,
    restoreOnly: true
});
export const globalBuildCacheSteps = createGlobalBuildCacheSteps({
    workingDirectory: DIR_WEBINY_JS,
    restoreOnly: true
});
export const runBuildCacheUploadSteps = createRunBuildArtifactUploadSteps({
    workingDirectory: DIR_WEBINY_JS
});
export const runBuildCacheDownloadSteps = createRunBuildArtifactDownloadSteps({
    workingDirectory: DIR_WEBINY_JS
});
