import * as aws from "@pulumi/aws";
import vpc from "./vpc";

class ElasticSearch {
    domain: aws.elasticsearch.Domain;

    constructor() {
        const domainName = "webiny-js";

        const dependsOn = aws.iam
            .getRole({ name: "AWSServiceRoleForAmazonElasticsearchService" })
            .then(role => {
                if (!role) {
                    return [
                        new aws.iam.ServiceLinkedRole("esServiceLinkedRole", {
                            awsServiceName: "es.amazonaws.com"
                        })
                    ];
                }

                return [];
            });

        this.domain = new aws.elasticsearch.Domain(
            domainName,
            {
                elasticsearchVersion: "7.7",
                clusterConfig: {
                    instanceType: "t3.small.elasticsearch"
                },
                vpcOptions: {
                    subnetIds: [vpc.subnets.private[0].id],
                    securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
                },
                ebsOptions: {
                    ebsEnabled: true,
                    volumeSize: 10,
                    volumeType: "gp2"
                },
                advancedOptions: {
                    "rest.action.multi.allow_explicit_index": "true"
                },
                snapshotOptions: {
                    automatedSnapshotStartHour: 23
                },
                tags: {
                    Domain: "TestDomain"
                }
            },
            { dependsOn }
        );

        new aws.elasticsearch.DomainPolicy(`${domainName}-policy`, {
            domainName: this.domain.domainName.apply(v => `${v}`),
            accessPolicies: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: ["es:*"],
                        Principal: {
                            AWS: ["*"]
                        },
                        Effect: "Allow",
                        Resource: this.domain.arn.apply(v => `${v}/*`)
                    }
                ]
            }
        });
    }
}

export default ElasticSearch;
