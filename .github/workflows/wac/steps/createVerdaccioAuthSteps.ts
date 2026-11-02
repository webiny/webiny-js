const REGISTRY = "http://localhost:4873";
const USER = "webiny-bot";

/**
 * Registers a throwaway user with the local Verdaccio and writes its token into `.npmrc`, so
 * `yarn release --type=verdaccio` can publish. Verdaccio 6 treated an unknown token as anonymous,
 * which `publish: $all` allowed, so a dummy token was enough. Verdaccio 7 rejects an unknown token
 * with 401 ("bad username/password"), and npm refuses to publish without one (ENEEDAUTH).
 *
 * The registry only lives on the runner's localhost for this job and already lets anyone publish,
 * so the fixed password grants nothing beyond that. The token is never printed.
 */
export const createVerdaccioAuthSteps = ({ workingDirectory = "" } = {}) => {
    return [
        {
            name: "Create a Verdaccio user and write its token into .npmrc",
            "working-directory": workingDirectory,
            run: [
                // pm2 starts Verdaccio in the background, so wait until it answers.
                "for i in $(seq 1 30); do",
                `  curl -sf ${REGISTRY}/-/ping > /dev/null && break`,
                "  sleep 1",
                "done",
                `TOKEN=$(curl -sf -X PUT -H "Content-Type: application/json" \\`,
                `  -d '{"name":"${USER}","password":"${USER}"}' \\`,
                `  ${REGISTRY}/-/user/org.couchdb.user:${USER} | jq -r .token)`,
                'if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then',
                '  echo "::error::Could not create a Verdaccio user."',
                "  exit 1",
                "fi",
                `echo "//localhost:4873/:_authToken=\\"$TOKEN\\"" > .npmrc`
            ].join("\n")
        }
    ];
};
