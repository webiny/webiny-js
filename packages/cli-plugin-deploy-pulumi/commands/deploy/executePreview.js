module.exports = async ({ inputs, context, pulumi }) => {
    const PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE;

    const subprocess = pulumi.run({
        command: "preview",
        args: {
            diff: true,
            debug: inputs.debug
            // Preview command does not accept "--secrets-provider" argument.
            // secretsProvider: PULUMI_SECRETS_PROVIDER
        },
        execa: {
            env: {
                WEBINY_ENV: inputs.env,
                WEBINY_PROJECT_NAME: context.project.name,
                PULUMI_CONFIG_PASSPHRASE
            }
        }
    });

    subprocess.stdout.pipe(process.stdout);
    subprocess.stderr.pipe(process.stderr);

    await subprocess;

    context.success(`Preview successful.`);
};
