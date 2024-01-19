import os from "os";
import fs from "fs";
import path from "path";
import { insertImportToSourceFile } from "~/gen/insertImportToSourceFile";
import {
    WebsiteAppProcessor,
    ProcessParams as WebsiteAppProcessorProcessParams
} from "../WebsiteAppProcessor";

const THEME_PLUGIN_FILE_TEMPLATE = [
    `import { ThemePlugin } from "@webiny/app-website";`,
    `import theme from "{PATH}";`,
    `export default new ThemePlugin(theme);`
].join(os.EOL);

export class ThemeProcessor extends WebsiteAppProcessor {
    process({ projectConfig, tsMorphProject, paths }: WebsiteAppProcessorProcessParams) {
        const themeConfigs = projectConfig.theme;
        if (!themeConfigs) {
            return;
        }

        for (let i = 0; i < themeConfigs.length; i++) {
            const themeConfig = themeConfigs[i];
            const themeName = themeConfig.name;

            const newPluginFilePath = path.join(paths.pluginsFolderPath, `theme-${themeName}.tsx`);
            const newPluginFileContent = THEME_PLUGIN_FILE_TEMPLATE.replace(
                "{PATH}",
                path.relative(
                    path.dirname(newPluginFilePath),
                    path.join(process.cwd(), "plugins", themeConfig.path)
                )
            );

            console.log('writam', newPluginFilePath)
            fs.writeFileSync(newPluginFilePath, newPluginFileContent);
            insertImportToSourceFile({
                source: tsMorphProject.legacyPluginsFile,
                name: themeName,
                moduleSpecifier: `./theme-${themeName}`
            });
        }
    }
}
