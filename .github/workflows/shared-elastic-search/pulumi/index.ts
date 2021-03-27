import * as aws from "@pulumi/aws";

const domainName = "webiny-js";

const domain = new aws.elasticsearch.Domain(domainName, {
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
    }
});

new aws.elasticsearch.DomainPolicy(`${domainName}-policy`, {
    domainName: domain.domainName.apply(v => `${v}`),
    accessPolicies: Promise.all([aws.getCallerIdentity({})]).then(([currentCallerIdentity]) => ({
        Version: "2012-10-17",
        Statement: [
            /**
             * Allow requests signed with current account
             */
            {
                Effect: "Allow",
                Principal: {
                    AWS: currentCallerIdentity.accountId
                },
                Action: "es:*",
                Resource: domain.arn.apply(v => `${v}/*`)
            }
        ]
    }))
});
