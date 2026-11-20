import { getAwsProjectSdk } from "~/pulumi/getAwsProjectSdk.js";
import { getPostgresConfigFromExtension } from "./getPostgresConfigFromExtension.js";

/** Whether the project has `<Infra.AuroraPostgres />`, which puts the API (and its data) on Postgres. */
export const projectUsesPostgres = async (): Promise<boolean> => {
    const sdk = await getAwsProjectSdk();
    const projectConfig = await sdk.getProjectConfig();
    return Boolean(getPostgresConfigFromExtension(projectConfig));
};
