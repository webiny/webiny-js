import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { PulumiInputValue } from "../types";

type OriginConfig = PulumiInputValue<
    PulumiInputValue<aws.cloudfront.DistributionArgs["origins"]>[number]
>;

export class CloudFrontBucket extends pulumi.ComponentResource {
    public readonly s3Bucket: aws.s3.Bucket;
    public readonly origin: OriginConfig;

    constructor(name: string) {
        super("webiny:aws:CloudFrontBucket", name);

        const originIdentity = new aws.cloudfront.OriginAccessIdentity(`${name}-origin-identity`);

        this.s3Bucket = new aws.s3.Bucket(name, {
            acl: aws.s3.CannedAcl.Private,
            forceDestroy: true
        });

        this.origin = {
            originId: this.s3Bucket.arn,
            domainName: this.s3Bucket.bucketDomainName,
            s3OriginConfig: {
                originAccessIdentity: originIdentity.cloudfrontAccessIdentityPath
            }
        };

        // block any public access
        new aws.s3.BucketPublicAccessBlock(`${name}-bucket-block-access`, {
            bucket: this.s3Bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true
        });

        // Create an IAM policy to allow access to S3 bucket from cloudfront
        new aws.s3.BucketPolicy(`${name}-bucket-policy`, {
            bucket: this.s3Bucket.bucket,
            policy: {
                Version: "2012-10-17",
                Statement: this.s3Bucket.arn.apply(arn => {
                    const statements: aws.iam.PolicyStatement[] = [
                        {
                            Effect: "Allow",
                            Principal: { AWS: originIdentity.iamArn },
                            Action: ["s3:ListBucket", "s3:GetObject"],
                            Resource: [`${arn}`, `${arn}/*`]
                        }
                    ];

                    return statements;
                })
            }
        });
    }
}
