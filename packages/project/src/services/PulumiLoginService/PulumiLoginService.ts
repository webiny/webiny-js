import { createImplementation } from "@webiny/di-container";
import { GetPulumiService, PulumiLoginService } from "~/abstractions/index.js";
import { type AppModel } from "~/models/index.js";
import trimEnd from "lodash/trimEnd.js";
import fs from "fs";
import path from "path";

const SELF_MANAGED_BACKEND = ["s3://", "azblob://", "gs://"];

export class DefaultPulumiLoginService implements PulumiLoginService.Interface {
    constructor(private getPulumiService: GetPulumiService.Interface) {}

    async execute(app: AppModel) {
        const pulumi = await this.getPulumiService.execute({ app });

        const projectAppRelativePath = path.join("apps", app.name);

        // A couple of variations here, just to preserve backwards compatibility.
        let loginUrl = process.env.WEBINY_PULUMI_BACKEND;

        if (loginUrl) {
            // If the user passed `s3://my-bucket`, we want to store files in `s3://my-bucket/{project-application-path}`
            const selfManagedBackend = SELF_MANAGED_BACKEND.find(item =>
                loginUrl!.startsWith(item)
            );
            if (selfManagedBackend) {
                loginUrl = trimEnd(loginUrl, "/") + "/" + projectAppRelativePath;
                loginUrl = loginUrl.replace(/\\/g, "/");
            }
        } else {
            // By default, we use local file system as backend. All files are stored in project root's
            // `.pulumi` folder, e.g. `.pulumi/apps/admin`.
            const stateFilesFolder = app.paths.localPulumiStateFilesFolder.toString();

            if (!fs.existsSync(stateFilesFolder)) {
                fs.mkdirSync(stateFilesFolder, { recursive: true });
            }

            loginUrl = `file://${stateFilesFolder}`;
        }

        await pulumi.run({ command: ["login", loginUrl] });

        return { login: loginUrl };
    }
}

export const pulumiLoginService = createImplementation({
    abstraction: PulumiLoginService,
    implementation: DefaultPulumiLoginService,
    dependencies: [GetPulumiService]
});
