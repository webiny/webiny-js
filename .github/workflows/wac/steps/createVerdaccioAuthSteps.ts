const REGISTRY = "http://localhost:4873";
const USER = "webiny-bot";

/**
 * Registers a throwaway user with the local Verdaccio and writes its token into `.npmrc`, so
 * `yarn release --type=verdaccio` can publish. Verdaccio 6 treated an unknown token as anonymous,
 * which `publish: $all` allowed, so a dummy token was enough. Verdaccio 7 rejects an unknown token
 * with 401 ("bad username/password"), and npm refuses to publish without one (ENEEDAUTH).
 *
 * The registry only listens on the runner's localhost for this job. `.verdaccio.yaml` lets only
 * the registered user publish and allows one registration (`max_users: 1`), so this user is the
 * only one that can. The fixed password grants nothing outside that registry. The token is masked
 * and never printed.
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
                `RESPONSE=$(curl -sf -X PUT -H "Content-Type: application/json" \\`,
                `  -d '{"name":"${USER}","password":"${USER}"}' \\`,
                `  ${REGISTRY}/-/user/org.couchdb.user:${USER})`,
                // Node is on every runner image; jq is not guaranteed on all of them.
                `TOKEN=$(printf '%s' "$RESPONSE" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{process.stdout.write(JSON.parse(d).token||"")}catch{}})')`,
                'if [ -z "$TOKEN" ]; then',
                '  echo "::error::Could not create the Verdaccio user (is Verdaccio running, or was a user already registered?)."',
                "  exit 1",
                "fi",
                'echo "::add-mask::$TOKEN"',
                `echo "//localhost:4873/:_authToken=\\"$TOKEN\\"" > .npmrc`
            ].join("\n")
        }
    ];
};
