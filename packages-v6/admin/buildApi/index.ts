import path from "path";
import fs from "fs-extra";
import { FunctionHandlerTemplate, FunctionName, Plugin, PluginHandlerConfig } from "@webiny/core";
import { useContext } from "@webiny/cli";
import { createMorphProject } from "../utils";
import { injectSourceFromPlugins } from "./injectSourceFromPlugins";
import { prettierFormat } from "./prettierFormat";
import { bundle, EntryPoints } from "./bundle";

const templates: Map<FunctionHandlerTemplate, string> = new Map();
templates.set(FunctionHandlerTemplate.GRAPHQL, path.join(__dirname, "templates", "graphql.tpl.ts"));
templates.set(FunctionHandlerTemplate.GENERIC, path.join(__dirname, "templates", "generic.tpl.ts"));

// Function template is the same for all Webiny functions, but we will support custom templates in the future (TODO).
function createSourceBase(name: string, template: string, output: string) {
    const sourcePath = path.join(output, "generated", "api", name, "index.ts");
    fs.copySync(template, sourcePath);
    return sourcePath;
}

async function generateSourceFromPlugins(
    fnName: FunctionName,
    sourcePath: string,
    plugins: Plugin[]
) {
    const project = createMorphProject([sourcePath]);

    injectSourceFromPlugins(
        fnName,
        project.getSourceFile(sourcePath)!,
        plugins.filter(pl => fnName in (pl.api || {}))
    );

    await project.save();
}

type Templates = Partial<Record<FunctionName, FnConfig>>;

interface FnConfig {
    name: FunctionName;
    custom: boolean;
    templatePath?: string;
}

interface Options {
    watch: boolean;
}

export default async ({ watch }: Options) => {
    // Get unique names of all Lambda functions.
    const context = await useContext();
    const output = context.getOutputPath();
    const plugins = context.getPlugins();
    const functionConfigsMap = plugins.reduce<Templates>((acc, pl) => {
        if (!pl.api) {
            return acc;
        }

        const names = Object.keys(pl.api) as FunctionName[];
        for (const name of names) {
            const config: FnConfig = acc[name] || { name, custom: false, templatePath: undefined };

            const { handler, template } = pl.api[name] as PluginHandlerConfig;
            if (template) {
                config.custom = template === FunctionHandlerTemplate.CUSTOM;
                config.templatePath = templates.get(template);
            }

            // In custom functions (e.g., Cognito triggers), handler _is_ the template.
            if (handler && config.custom) {
                config.templatePath = resolveFilePathWithExtension(handler);
            }

            acc[name] = config;
        }

        return acc;
    }, {});

    // Validate final configs and convert to array of function configs.
    const functionConfigs = Object.keys(functionConfigsMap).map(name => {
        const config = functionConfigsMap[name as FunctionName]!;
        if (!config.templatePath) {
            throw Error(`Function "${config.name}" doesn't have a template defined!`);
        }
        return config;
    });

    // For each function create a copy of a template in the `build` folder.
    // Then, generate plugins/configs imports and populate each template.
    const entryPoints: EntryPoints = new Map();
    for (const config of functionConfigs) {
        context.debug(
            `Using ${context.debug.hl(config.templatePath)} template for ${context.debug.hl(
                config.name
            )}.`
        );
        const sourcePath = createSourceBase(config.name, config.templatePath!, output);
        if (!config.custom) {
            await generateSourceFromPlugins(config.name, sourcePath, plugins);
        }
        entryPoints.set(config.name, sourcePath);
    }

    // Format with prettier
    await prettierFormat([...entryPoints.values()]);

    // Lastly, run webpack build.
    await bundle({
        entryPoints,
        plugins,
        output,
        watch
    });
};

const resolveFilePathWithExtension = (filePath: string) => {
    const extensions = [".ts", ".js", ".mjs", ".cjs"];

    if (extensions.includes(path.extname(filePath))) {
        return filePath;
    }

    for (const ext of extensions) {
        if (fs.existsSync(filePath + ext)) {
            return filePath + ext;
        }
    }

    throw Error(`Couldn't resolve ${filePath} extension!`);
};
