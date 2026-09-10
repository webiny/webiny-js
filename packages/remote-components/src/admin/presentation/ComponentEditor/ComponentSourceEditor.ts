import * as acorn from "acorn";
import acornJsx from "acorn-jsx";

const jsxParser = acorn.Parser.extend(acornJsx());

function parseSource(source: string): any {
    return jsxParser.parse(source, {
        ecmaVersion: "latest",
        sourceType: "module"
    });
}

function findManifestNode(ast: any): any | null {
    for (const node of ast.body) {
        if (
            node.type === "ExportNamedDeclaration" &&
            node.declaration?.type === "VariableDeclaration"
        ) {
            for (const decl of node.declaration.declarations) {
                if (decl.id.name === "manifest" && decl.init?.type === "ObjectExpression") {
                    return decl.init;
                }
            }
        }
    }
    return null;
}

function findManifestProperty(manifestNode: any, name: string): any | null {
    return (
        manifestNode.properties.find(
            (p: any) => p.type === "Property" && p.key.type === "Identifier" && p.key.name === name
        ) ?? null
    );
}

export class ComponentSourceEditor {
    updateManifestProperties(source: string, updates: Record<string, string>): string {
        const ast = parseSource(source);
        const manifestNode = findManifestNode(ast);

        if (!manifestNode) {
            return source;
        }

        let result = source;
        let offset = 0;

        for (const prop of manifestNode.properties) {
            if (prop.type !== "Property" || prop.key.type !== "Identifier") {
                continue;
            }
            const key = prop.key.name;
            if (!(key in updates)) {
                continue;
            }
            const newValue = JSON.stringify(updates[key]);
            const valueStart = prop.value.start + offset;
            const valueEnd = prop.value.end + offset;
            result = result.slice(0, valueStart) + newValue + result.slice(valueEnd);
            offset += newValue.length - (prop.value.end - prop.value.start);
        }

        return result;
    }

    setDefaults(source: string, bindings: Record<string, any>): string {
        const defaultInputs = this.buildNestedDefaults(bindings);

        if (Object.keys(defaultInputs).length === 0) {
            return source;
        }

        const ast = parseSource(source);
        const manifestNode = findManifestNode(ast);

        if (!manifestNode) {
            return source;
        }

        const defaultsBlock = `defaults: {\n        inputs: ${JSON.stringify(defaultInputs, null, 8)}\n    }`;
        const defaultsProp = findManifestProperty(manifestNode, "defaults");

        if (defaultsProp) {
            return (
                source.slice(0, defaultsProp.start) + defaultsBlock + source.slice(defaultsProp.end)
            );
        }

        const lastProp = manifestNode.properties[manifestNode.properties.length - 1];
        return (
            source.slice(0, lastProp.end) + ",\n    " + defaultsBlock + source.slice(lastProp.end)
        );
    }

    extractAiContext(source: string): string {
        const match = source.match(/aiContext\s*:\s*["'`]([^"'`]+)["'`]/);
        return match ? match[1] : "";
    }

    private buildNestedDefaults(bindings: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = {};

        for (const [inputPath, binding] of Object.entries(bindings)) {
            const value = binding?.static;
            if (value === undefined) {
                continue;
            }

            const segments = inputPath.split("/");
            let target: any = result;

            for (let i = 0; i < segments.length - 1; i++) {
                const seg = segments[i];
                const nextSeg = segments[i + 1];
                const isNextIndex = /^\d+$/.test(nextSeg);

                if (!(seg in target)) {
                    target[seg] = isNextIndex ? [] : {};
                }
                target = target[seg];
            }

            const lastSeg = segments[segments.length - 1];
            target[lastSeg] = value;
        }

        return result;
    }
}
