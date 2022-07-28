import * as aws from "@pulumi/aws";
import { PulumiApp } from "@webiny/pulumi";

export function getAwsAccountId(app: PulumiApp) {
    return app.addHandler(() => {
        return aws.getCallerIdentity({}).then(x => x.accountId);
    });
}

export function getAwsRegion(app: PulumiApp) {
    return app.addHandler(() => {
        return aws.config.requireRegion();
    });
}
