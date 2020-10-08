import * as aws from "@pulumi/aws";

class DefaultLambdaRole {
    role: aws.iam.Role;
    policy: aws.iam.RolePolicyAttachment;
    constructor() {
        this.role = new aws.iam.Role("default-lambda-role", {
            assumeRolePolicy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Principal: {
                            Service: "lambda.amazonaws.com"
                        },
                        Effect: "Allow"
                    }
                ]
            }
        });

        this.policy = new aws.iam.RolePolicyAttachment("default-lambda-role-policy", {
            role: this.role,
            policyArn: "arn:aws:iam::aws:policy/AdministratorAccess"
        });
    }
}

const defaultLambdaRole = new DefaultLambdaRole();
export default defaultLambdaRole;
