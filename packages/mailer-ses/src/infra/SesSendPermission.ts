import { ApiPulumi } from "@webiny/project-extensions-aws/abstractions/features/pulumi/index.js";
import { parseMailbox } from "@webiny/api-mailer";

/**
 * Lets the API functions call ses:SendEmail as the sender in WEBINY_API_SES_FROM.
 *
 * The policy goes on the GraphQL function's role. The streaming GraphQL function, background tasks
 * and the scheduler run under the same role, so mail sent from any of them is covered.
 */
class SesSendPermissionImpl implements ApiPulumi.Interface {
    async execute(app: ApiPulumi.Params): Promise<void> {
        const from = process.env.WEBINY_API_SES_FROM;
        if (!from) {
            return;
        }

        // Imported here: this file loads with the project config, and only a deploy needs Pulumi.
        const aws = await import("@pulumi/aws");

        const address = parseMailbox(from)?.address ?? from.trim();
        const domain = address.split("@")[1];
        const region = process.env.WEBINY_API_SES_REGION || aws.config.requireRegion();
        const configurationSet = process.env.WEBINY_API_SES_CONFIGURATION_SET;

        const policy = aws.getCallerIdentityOutput().accountId.apply(accountId => {
            const arn = (resource: string) => `arn:aws:ses:${region}:${accountId}:${resource}`;

            /*
             * SES checks the domain identity when the domain is verified, and the address identity
             * when only the address is. Both are listed so either setup works.
             */
            const resources = [arn(`identity/${domain}`), arn(`identity/${address}`)];
            if (configurationSet) {
                resources.push(arn(`configuration-set/${configurationSet}`));
            }

            return JSON.stringify({
                Version: "2012-10-17",
                Statement: [{ Effect: "Allow", Action: ["ses:SendEmail"], Resource: resources }]
            });
        });

        app.addResource(aws.iam.RolePolicy, {
            name: "api-ses-send-email",
            config: {
                role: app.resources.graphql.role.output.name,
                policy
            }
        });
    }
}

export default ApiPulumi.createImplementation({
    implementation: SesSendPermissionImpl,
    dependencies: []
});
