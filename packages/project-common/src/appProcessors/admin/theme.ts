import fs from "fs";
import util from "util";
import path from "path";
import ncpBase from "ncp";
import { runConfig } from "./runConfig";
import { SourceFile } from "ts-morph";
import { createTsMorphProject } from "~/gen/createTsMorphProject";
import { insertImportToSourceFile } from "~/gen/insertImportToSourceFile";

const ncp = util.promisify(ncpBase.ncp);

interface ProjectApplication {
    name: string;
}

interface ConfigHandlerParams {
    projectApplication: ProjectApplication;
    config: any;
    tsMorphProject: any;
    pluginsFolderPath: string;
    legacyPluginsFilePath: string;
    reactPluginsFilePath: string;
    projectRootPath: string;
}

abstract class WebsiteWorkspaceProcessor {
    abstract readonly type: string;
    abstract process(params: ConfigHandlerParams): void | Promise<void>;
}

class ThemePluginProcessor extends AbstractPluginProcessor {
    process() {
        const src: SourceFile = tsMorphProject.getSourceFile(legacyPluginsFilePath);

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
                source: src,
                name: themeName,
                moduleSpecifier: `./theme-${themeName}`
            });
        }
    }
}