import { listPackagesWithJestTests, NODE_VERSION } from "../utils";
import { NormalJob } from "github-actions-wac";
import { createJob } from "./createJob";

export const createJestTestsJob = (storage: string | null) => {
    const env: Record<string, string> = {};

    if (storage) {
        if (storage === "ddb-es") {
            env["AWS_ELASTIC_SEARCH_DOMAIN_NAME"] = "${{ secrets.AWS_ELASTIC_SEARCH_DOMAIN_NAME }}";
            env["ELASTIC_SEARCH_ENDPOINT"] = "${{ secrets.ELASTIC_SEARCH_ENDPOINT }}";
            env["ELASTIC_SEARCH_INDEX_PREFIX"] = "${{ matrix.package.id }}";
        } else if (storage === "ddb-os") {
            // We still use the same environment variables as for "ddb-es" setup, it's
            // just that the values are read from different secrets.
            env["AWS_ELASTIC_SEARCH_DOMAIN_NAME"] = "${{ secrets.AWS_OPEN_SEARCH_DOMAIN_NAME }}";
            env["ELASTIC_SEARCH_ENDPOINT"] = "${{ secrets.OPEN_SEARCH_ENDPOINT }}";
            env["ELASTIC_SEARCH_INDEX_PREFIX"] = "${{ matrix.package.id }}";
        }
    }

    const packages = listPackagesWithJestTests({
        storage
    });

    const job: NormalJob = createJob({
        needs: "init",
        name: "${{ matrix.package.cmd }}",
        strategy: {
            "fail-fast": false,
            matrix: {
                os: ["ubuntu-latest"],
                node: [NODE_VERSION],
                package: "${{ fromJson('" + JSON.stringify(packages) + "') }}"
            }
        },
        "runs-on": "${{ matrix.os }}",
        env,
        awsAuth: storage === "ddb-es" || storage === "ddb-os",
        steps: [
            {
                uses: "actions/cache@v4",
                with: {
                    path: ".yarn/cache",
                    key: "yarn-${{ runner.os }}-${{ hashFiles('**/yarn.lock') }}"
                }
            },
            {
                uses: "actions/cache@v4",
                with: {
                    path: ".webiny/cached-packages",
                    key: "packages-cache-${{ needs.init.outputs.ts }}"
                }
            },
            {
                name: "Install dependencies",
                run: "yarn --immutable"
            },
            {
                name: "Build packages",
                run: "yarn build:quick"
            },
            {
                name: "Run tests",
                run: "yarn test ${{ matrix.package.cmd }}"
            }
        ]
    });

    // We prevent running of Jest tests if a PR was created from a fork.
    // This is because we don't want to expose our AWS credentials to forks.
    if (storage === "ddb-es" || storage === "ddb-os") {
        job.if = "needs.init.outputs.is-fork-pr != 'true'";
    }

    return job;
};
