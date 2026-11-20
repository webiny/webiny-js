/*
 * `webiny/infra` exports the AWS services in every project, so a standalone extension can import
 * them. Only `@webiny/project-aws` implements them; without the standalone implementations in this
 * folder, a hook that depends on one fails with "No registration found for ApiStackOutputService".
 * They say which hosting type the service belongs to instead. They throw when called, not when
 * created, so a hook that depends on one but never calls it in a standalone project still runs.
 */
export const createAwsOnlyError = (name: string) => {
    return new Error(`"${name}" is only available in AWS projects.`);
};
