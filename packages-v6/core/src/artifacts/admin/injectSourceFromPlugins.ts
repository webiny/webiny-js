import { ArrayLiteralExpression, SourceFile } from "ts-morph";
import { Plugin } from "../../index";
import { getDeclaration, getModulePath } from "../../utils";

export function injectSourceFromPlugins(source: SourceFile, plugins: Plugin[]) {
    const configModifiers = getDeclaration("configModifiers", source);
    const pluginsModifiers = getDeclaration("pluginsModifiers", source);

    const configModifiersArray = configModifiers.getInitializer() as ArrayLiteralExpression;
    const pluginsModifiersArray = pluginsModifiers.getInitializer() as ArrayLiteralExpression;

    [...plugins].reverse().forEach(plugin => {
        const appConfig = plugin.admin!;
        const factoryName = `create${plugin.name}`;

        if (appConfig.plugin) {
            source.addImportDeclaration({
                defaultImport: factoryName,
                moduleSpecifier: getModulePath(appConfig.plugin)
            });

            pluginsModifiersArray.addElement(`${factoryName}(config)`);
        }

        if (appConfig.config) {
            const configModifierName = `${factoryName}Config`;

            source.addImportDeclaration({
                defaultImport: configModifierName,
                moduleSpecifier: getModulePath(appConfig.config)
            });

            configModifiersArray.addElement(configModifierName);
        }
    });
}
