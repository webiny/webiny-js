import fs from "fs";
import path from "path";
import { insertImportToSourceFile } from "~/gen/insertImportToSourceFile";
import { WebsiteAppProcessor } from "./WebsiteAppProcessor";

export class ThemePluginProcessor extends WebsiteAppProcessor {
    process({ tsMorphProject, projectConfig, paths }) {
        const { legacyPluginsSourceFile } = tsMorphProject;
        const { themeConfigs } = projectConfig;
        const { pluginsFolderPath } = paths;

        for (let i = 0; i < themeConfigs.length; i++) {
            const themeConfig = themeConfigs[i];
            const themeName = themeConfig.name;

            const templateFilePath = path.join(__dirname, "gen", "themePlugin.ts.tpl");
            const pluginFilePath = path.join(pluginsFolderPath, `theme-${themeName}.tsx`);

            let tpl = fs.readFileSync(templateFilePath, "utf-8");
            tpl = tpl.replace(
                "{PATH}",
                path.relative(
                    path.dirname(pluginFilePath),
                    path.join(process.cwd(), "plugins", themeConfig.path)
                )
            );

            fs.writeFileSync(pluginFilePath, tpl);
            insertImportToSourceFile({
                source: legacyPluginsSourceFile,
                name: themeName,
                moduleSpecifier: `./theme-${themeName}`
            });
        }
    }
}
