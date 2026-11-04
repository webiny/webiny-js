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
// Dependencies only, for jobs that use packages from Verdaccio rather than the built ones: the e2e
// runner and Verdaccio itself are all they need from the checkout.
export const installSteps = [
    {
        name: "Install dependencies",
        "working-directory": DIR_WEBINY_JS,
        run: "yarn --immutable"
    }
];
// Restore-only: the `/e2e` workflow is triggered by `issue_comment`, so its cache token cannot
// write. These step groups are used by that workflow only - `push.yml` builds its own (savable)
// ones and imports just `createStandaloneProjectParts` from here.
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
