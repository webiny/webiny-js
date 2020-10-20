import * as aws from "@pulumi/aws";
import vpc from "./vpc";

class ElasticSearch {
    domain: aws.elasticsearch.Domain;

    constructor() {
        const domainName = "webiny-js";

        const currentRegion = aws.getRegion({});
        const currentCallerIdentity = aws.getCallerIdentity({});

        const esServiceLinkedRole = new aws.iam.ServiceLinkedRole("esServiceLinkedRole", {
            awsServiceName: "es.amazonaws.com"
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
                accessPolicies: Promise.all([currentRegion, currentCallerIdentity]).then(
                    ([currentRegion, currentCallerIdentity]) => ({
                        Version: "2012-10-17",
                        Statement: [
                            {
                                Action: ["es:*"],
                                Principal: {
                                    AWS: ["*"]
                                },
                                Effect: "Allow",
                                Resource: `arn:aws:es:${currentRegion.name}:${currentCallerIdentity.accountId}:domain/${domainName}/*`
                            }
                        ]
                    })
                ),
                snapshotOptions: {
                    automatedSnapshotStartHour: 23
                },
                tags: {
                    Domain: "TestDomain"
                }
            },
            {
                dependsOn: [esServiceLinkedRole]
            }
        );
    }
}

export default ElasticSearch;
