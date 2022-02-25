import { ArrayLiteralExpression, SourceFile } from "ts-morph";
import { FunctionName, PluginHandlerConfig, Plugin } from "@webiny/core";
import { getModulePath, getDeclaration } from "../utils";

export function injectSourceFromPlugins(
  fnName: FunctionName,
  source: SourceFile,
  plugins: Plugin[]
) {
  const configModifiers = getDeclaration("configModifiers", source);
  const pluginsModifiers = getDeclaration("pluginsModifiers", source);

  const configModifiersArray = configModifiers.getInitializer() as ArrayLiteralExpression;
  const pluginsModifiersArray = pluginsModifiers.getInitializer() as ArrayLiteralExpression;

  // In case the given template doesn't contain the required placeholders, don't inject anything.
  if (!configModifiersArray || !pluginsModifiersArray) {
    return;
  }

  [...plugins].reverse().forEach((plugin) => {
    // In here we only process `HandlerConfig` so we can cast it explicitly.
    const fnConfig = plugin.api![fnName] as PluginHandlerConfig;
    if (!fnConfig) {
      return;
    }

    const factoryName = `create${plugin.name}`;

    if (fnConfig.handler) {
      source.addImportDeclaration({
        defaultImport: factoryName,
        moduleSpecifier: getModulePath(fnConfig.handler),
      });

      pluginsModifiersArray.addElement(`${factoryName}(config)`);
    }

    if (fnConfig.config) {
      const configModifierName = `${factoryName}Config`;

      source.addImportDeclaration({
        defaultImport: configModifierName,
        moduleSpecifier: getModulePath(fnConfig.config),
      });

      configModifiersArray.addElement(configModifierName);
    }
  });
}
