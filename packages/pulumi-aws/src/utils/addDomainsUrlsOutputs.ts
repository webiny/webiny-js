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

    // These will always contain the default Cloudfront domain,
    // no matter if the user provided a custom domain or not.
    const distributionDomain = cloudfrontDistribution.output.domainName;
    const distributionUrl = distributionDomain.apply(value => `https://${value}`);

    app.addOutputs({
        [map.distributionDomain]: distributionDomain,
        [map.distributionUrl]: distributionUrl,

        // These will contain a custom domain if provided,
        // otherwise again the default Cloudfront domain.
        [map.usedDomain]: distributionDomain,
        [map.usedUrl]: distributionUrl
    });

    // We're adjusting the outputs via the `config.aliases` setter.
    // At the time of implementing this, could not find a better solution.
    cloudfrontDistribution.config.aliases(aliases => {
        const [firstAlias] = aliases || [];
        if (firstAlias) {
            app.addOutputs({
                [map.usedDomain]: pulumi.output(firstAlias),
                [map.usedUrl]: pulumi.output(`https://${firstAlias}`)
            });
        }

        return aliases;
    });
};
