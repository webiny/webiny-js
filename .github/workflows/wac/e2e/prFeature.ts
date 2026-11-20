/*
 * A feature the `/e2e` workflow checked the PR's code for. The checking job outputs `true` or
 * `false` under the feature's name; this turns that one output into everything a job needs to read
 * it, so the three can't disagree.
 */
export interface PrFeature {
    // The job that ran the check. Any job whose `if` reads `has` or `lacks` must list it in `needs`.
    needs: string;
    // Holds when the PR's code has the feature.
    has: string;
    /*
     * Holds when the PR's code lacks it. Not the negation of `has`: when the check itself failed,
     * the output is empty and neither holds.
     */
    lacks: string;
}

export const createPrFeature = (job: string, output: string): PrFeature => {
    const value = `needs.${job}.outputs.${output}`;
    return {
        needs: job,
        has: `${value} == 'true'`,
        lacks: `${value} == 'false'`
    };
};
