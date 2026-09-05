// Shared constants for the `/e2e` command workflow.

// Resolves to "next" or "dev" - the PR's base branch, used as the checkout path and working
// directory. Important for caching (via actions/cache).
export const DIR_WEBINY_JS = "${{ needs.baseBranch.outputs.base-branch }}";

// The AWS-deployed test project, scaffolded at the workspace root.
export const DIR_TEST_PROJECT = "new-webiny-project";

// Absolute path to the same project, for steps that run from DIR_WEBINY_JS and so cannot reach it
// by name. Don't use "../" for this: DIR_WEBINY_JS is a branch name and branch names contain
// slashes, so the checkout is often more than one directory deep.
export const PATH_TEST_PROJECT = `\${{ github.workspace }}/${DIR_TEST_PROJECT}`;

// The self-hosted ("server" hosting type) test project. Kept separate from the AWS one so both can
// exist in the same run without colliding.
export const DIR_SERVER_PROJECT = "new-webiny-project-server";
export const SERVER_BUILD_DIR = `${DIR_SERVER_PROJECT}/.webiny/workspace/apps`;

// Ports match the server template defaults (WEBINY_API_PORT / WEBINY_ADMIN_PORT), which is also
// what `setup-cypress --localhost` assumes.
export const SERVER_API_PORT = 3002;
export const SERVER_ADMIN_PORT = 3001;
export const SERVER_API_URL = `http://localhost:${SERVER_API_PORT}`;
export const SERVER_ADMIN_URL = `http://localhost:${SERVER_ADMIN_PORT}`;
