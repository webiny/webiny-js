const IAM_ROLE = "arn:aws:iam::726952677045:role/GitHubActionsWebinyJs";

export const createAwsCredentialsStep = () => {
    return {
        name: "Configure AWS Credentials",
        uses: "aws-actions/configure-aws-credentials@v4",
        with: {
            "role-to-assume": IAM_ROLE,
            "aws-region": "eu-central-1"
        }
    };
};
