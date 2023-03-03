import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { PulumiApp, PulumiAppResource } from "@webiny/pulumi";

interface AddDomainsUrlsOutputsParams {
    cloudfrontDistribution: PulumiAppResource<typeof aws.cloudfront.Distribution>;
    app: PulumiApp;
    map: {
        distributionDomain: string;
        distributionUrl: string;
        usedDomain: string;
        usedUrl: string;
    };
}

/**
 * Based on the provided Cloudfront distribution and map,
 * adds domain and URL-related values to final stack output.
 */
export const addDomainsUrlsOutputs = (params: AddDomainsUrlsOutputsParams) => {
    const { cloudfrontDistribution, app, map } = params;

    cloudfrontDistribution.output.aliases.apply(aliases => {
        // These will always contain the default Cloudfront domain,
        // no matter if the user provided a custom domain or not.
        const distributionDomain = cloudfrontDistribution.output.domainName;
        const distributionUrl = distributionDomain.apply(value => `https://${value}`);

        // These will contain a custom domain if provided,
        // otherwise again the default Cloudfront domain.
        let usedDomain = distributionDomain;
        let usedUrl = distributionUrl;

        const [firstAlias] = aliases || [];
        if (firstAlias) {
            usedDomain = pulumi.output(firstAlias);
            usedUrl = pulumi.output(`https://${firstAlias}`);
        }

        app.addOutputs({
            [map.distributionDomain]: distributionDomain,
            [map.distributionUrl]: distributionUrl,
            [map.usedDomain]: usedDomain,
            [map.usedUrl]: usedUrl
        });
    });
};
