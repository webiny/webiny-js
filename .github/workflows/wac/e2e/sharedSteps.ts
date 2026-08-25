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
export const yarnCacheSteps = createYarnCacheSteps({ workingDirectory: DIR_WEBINY_JS });
export const globalBuildCacheSteps = createGlobalBuildCacheSteps({
    workingDirectory: DIR_WEBINY_JS
});
export const runBuildCacheUploadSteps = createRunBuildArtifactUploadSteps({
    workingDirectory: DIR_WEBINY_JS
});
export const runBuildCacheDownloadSteps = createRunBuildArtifactDownloadSteps({
    workingDirectory: DIR_WEBINY_JS
});
