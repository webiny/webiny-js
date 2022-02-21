import { Octokit } from "octokit";

// TODO: try to add octokit types properly based on
// https://www.npmjs.com/package/@octokit/types
interface GithubRepository {
    full_name: string;
    name: string;
    owner: {
        login: string;
    };
}

interface Params {
    octokit: Octokit;
}
export default async (args: Params): Promise<GithubRepository[]> => {
    const octokit = args.octokit;

    let page = 0;
    const results: GithubRepository[] = [];

    while (true) {
        const pageResult = (
            await octokit.rest.repos.listForAuthenticatedUser({ page, per_page: 100 })
        ).data;

        // Add pageResult to all results
        results.push(...pageResult);

        // Stop the loop if there are no more results
        if (pageResult.length === 0) {
            break;
        }

        // Fetch next page
        page++;
    }

    return results;
};
