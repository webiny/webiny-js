import * as aws from "@pulumi/aws";

class ElasticSearch {
    domain: aws.elasticsearch.Domain;

    constructor() {
        const domainName = "webiny-js";

        this.domain = new aws.elasticsearch.Domain(domainName, {
            elasticsearchVersion: "7.7",
            clusterConfig: {
                instanceType: "t3.small.elasticsearch"
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
        });

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
