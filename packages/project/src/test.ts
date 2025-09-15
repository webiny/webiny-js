import { ProjectSdk } from "./ProjectSdk.js";

const projectSdk = await ProjectSdk.init();

process.env.AWS_REGION = "eu-central-1";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const rez = await projectSdk.watch({
    app: "api",
    env: "dev",
    package: ["graphql"]
});
