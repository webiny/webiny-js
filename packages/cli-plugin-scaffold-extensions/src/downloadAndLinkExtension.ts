import os from "os";
import path from "path";
import fs from "node:fs";
import fsAsync from "node:fs/promises";
import { CliCommandScaffoldCallableArgs } from "@webiny/cli-plugin-scaffold/types";

// @ts-expect-error (missing types)
import downloadFolderFromGitHub from "github-directory-downloader";

import { linkAllExtensions } from "./generators/utils/linkAllExtensions";
import { Input } from "./types";

const EXTENSIONS_ROOT_FOLDER = "extensions";
const WEBINY_EXAMPLES_REPO_URL = "https://github.com/webiny/webiny-examples";

export const downloadAndLinkExtension = async ({
    input,
    ora,
    context
}: CliCommandScaffoldCallableArgs<Input>) => {
    const source = input.templateArgs!;
    const currentWebinyVersion = context.version;

    let url = source;
    if (!url.startsWith("https")) {
        url = WEBINY_EXAMPLES_REPO_URL + "/tree/master/" + url;
    }

    try {
        ora.start(`Downloading extension...`);

        const randomId = String(Date.now());
        const tempDownloadFolderPath = path.join(os.tmpdir(), `wby-ext-${randomId}`);
        const stats = await downloadFolderFromGitHub(url, tempDownloadFolderPath, {
            muteLog: true,
            requests: 2
        });

        console.log(stats)
        const withoutVersions = fs.existsSync(path.join(tempDownloadFolderPath, "extensions"));
        if (withoutVersions) {
            const extensionsFolderToCopy = path.join(tempDownloadFolderPath, "extensions");
            await fsAsync.cp(extensionsFolderToCopy, EXTENSIONS_ROOT_FOLDER, {
                recursive: true
            });
        } else {
            // sleeep 1000
            await new Promise(resolve => setTimeout(resolve, 1000));

            const availableVersions = await fsAsync
                .readdir(tempDownloadFolderPath)
                .then(versions => {
                    return versions.map(v => v.replace(".x", ".0")).sort();
                });

            let versionToUse = "";

            // When developing Webiny, we want to use the latest version.
            if (currentWebinyVersion === "0.0.0") {
                versionToUse = availableVersions[availableVersions.length - 1];
            } else {
                for (const availableVersion of availableVersions) {
                    if (currentWebinyVersion >= availableVersion) {
                        versionToUse = availableVersion;
                    } else {
                        break;
                    }
                }
            }

            versionToUse = versionToUse.replace(".0", ".x");

            const extensionsFolderToCopy = path.join(
                tempDownloadFolderPath,
                versionToUse,
                "extensions"
            );
            await fsAsync.cp(extensionsFolderToCopy, EXTENSIONS_ROOT_FOLDER, {
                recursive: true
            });
        }

        await linkAllExtensions();

        ora.succeed(`Extension downloaded in ${context.success.hl("kob")}.`);
    } catch (e) {
        ora.fail("Could not create extension. Please check the logs below.");
        console.log();
        console.log(e);
    }
};
