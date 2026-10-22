import { createSetupVerdaccioSteps } from "../steps/index.js";
import { ACTION } from "../utils/index.js";

// The packages are published to Verdaccio once per `/e2e` run, by the `publish` job, and every
// test job starts its own Verdaccio on that storage. Before, each of the six jobs versioned and
// published every package itself, which took 1.3 to 2.2 minutes per job.
//
// Tarred for the same reason as the run build cache (see createRunBuildArtifactSteps): one zstd
// file uploads and downloads faster than thousands of small ones.
const ARCHIVE = "verdaccio-storage.tzst";
const ARTIFACT_NAME = "verdaccio-storage";

interface VerdaccioStepsParams {
    // Where the webiny-js checkout lives. `.verdaccio.yaml` keeps its storage in `.verdaccio/`
    // next to it.
    workingDirectory: string;
}

/**
 * Starts Verdaccio, then versions every package and publishes it there under the `local-npm` tag.
 * Needs built packages.
 */
export const createPublishToVerdaccioSteps = ({ workingDirectory }: VerdaccioStepsParams) => [
    ...createSetupVerdaccioSteps({ workingDirectory }),
    {
        name: 'Create ".npmrc" file in the project root, with a dummy auth token',
        "working-directory": workingDirectory,
        run: "echo '//localhost:4873/:_authToken=\"dummy-auth-token\"' > .npmrc"
    },
    {
        name: "Version and publish to Verdaccio",
        "working-directory": workingDirectory,
        run: "yarn release --type=verdaccio"
    }
];

export const createUploadVerdaccioStorageSteps = ({ workingDirectory }: VerdaccioStepsParams) => [
    {
        name: "Compress Verdaccio storage",
        run: `tar -cf ${ARCHIVE} --use-compress-program=zstdmt -C "${workingDirectory}" .verdaccio`
    },
    {
        name: "Upload Verdaccio storage",
        uses: ACTION.uploadArtifact,
        with: {
            name: ARTIFACT_NAME,
            path: ARCHIVE,
            "retention-days": 1,
            // Already zstd-compressed.
            "compression-level": 0,
            "if-no-files-found": "error",
            // A full re-run uploads it again under the same name.
            overwrite: true
        }
    }
];

/**
 * Starts Verdaccio on the storage the `publish` job uploaded, so `create-webiny-project@local-npm`
 * resolves the packages built from this PR. Unlike the run build cache, a missing artifact fails
 * the job: there is nothing to fall back to.
 */
export const createRestoreVerdaccioSteps = ({ workingDirectory }: VerdaccioStepsParams) => [
    {
        name: "Download Verdaccio storage",
        uses: ACTION.downloadArtifact,
        with: { name: ARTIFACT_NAME }
    },
    {
        name: "Extract Verdaccio storage",
        run: `tar -xf ${ARCHIVE} --use-compress-program=zstdmt -C "${workingDirectory}"`
    },
    ...createSetupVerdaccioSteps({ workingDirectory })
];
