export default async () => {
    const projectApplication = await import("../webiny.application.js").then(m => m.default ?? m);

    const pulumi = await projectApplication.getPulumi();
    return pulumi.run({
        env: "%{DEPLOY_ENV}",
        variant: "%{DEPLOY_VARIANT}"
    });
};
