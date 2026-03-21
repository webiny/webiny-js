/**
 * Shared ts-morph utilities for type extraction across all plugins.
 */
import { Project, SourceFile, Node, Type, Symbol as MorphSymbol, ts } from "ts-morph";
import { createHash } from "crypto";
import path from "path";

export interface TypeUtils {
    followReExport(
        project: Project,
        barrelFilePath: string,
        exportName: string
    ): SourceFile | undefined;
    extractNamespaceTypes(
        sourceFile: SourceFile,
        namespaceName: string,
        memberNames: string[]
    ): Record<string, string>;
    inlineType(type: Type, opts?: InlineOpts): string;
    computeHash(content: string): string;
    getSourceInfo(sourceFile: SourceFile): { package: string; file: string };
    resolveEventPayload(
        sourceFile: SourceFile,
        eventClassName: string
    ): string;
}

export interface InlineOpts {
    maxProps?: number;
    maxDepth?: number;
    currentDepth?: number;
    visited?: Set<string>;
    indent?: string;
}

const DEFAULT_INLINE_OPTS: Required<Omit<InlineOpts, "visited" | "indent">> = {
    maxProps: 15,
    maxDepth: 2,
    currentDepth: 0,
};

/**
 * Follow a re-export chain from a barrel file to the actual source file.
 */
export function followReExport(
    project: Project,
    barrelFilePath: string,
    exportName: string
): SourceFile | undefined {
    const barrelFile = project.getSourceFile(barrelFilePath);
    if (!barrelFile) return undefined;

    for (const exportDecl of barrelFile.getExportDeclarations()) {
        const namedExports = exportDecl.getNamedExports();
        const match = namedExports.find(
            ne => ne.getName() === exportName || ne.getAliasNode()?.getText() === exportName
        );
        if (match) {
            return exportDecl.getModuleSpecifierSourceFile() || undefined;
        }
    }
    return undefined;
}

/**
 * Extract type text for named members of a namespace.
 * Returns a map of memberName → type text.
 */
export function extractNamespaceTypes(
    sourceFile: SourceFile,
    namespaceName: string,
    memberNames: string[]
): Record<string, string> {
    const result: Record<string, string> = {};
    const ns = sourceFile.getModule(namespaceName);
    if (!ns) return result;

    for (const name of memberNames) {
        const typeAlias = ns.getTypeAlias(name);
        if (typeAlias) {
            const typeNode = typeAlias.getTypeNode();
            if (typeNode) {
                result[name] = typeNode.getText();
            }
        }
    }

    return result;
}

/**
 * Inline a TypeScript type into a readable string representation.
 * Recursively resolves object types up to maxDepth, with maxProps limit.
 */
export function inlineType(type: Type, opts?: InlineOpts): string {
    const maxProps = opts?.maxProps ?? DEFAULT_INLINE_OPTS.maxProps;
    const maxDepth = opts?.maxDepth ?? DEFAULT_INLINE_OPTS.maxDepth;
    const currentDepth = opts?.currentDepth ?? 0;
    const visited = opts?.visited ?? new Set<string>();
    const indent = opts?.indent ?? "  ";

    // Prevent infinite recursion
    const typeId = type.getText();
    if (visited.has(typeId) || currentDepth > maxDepth) {
        return typeId;
    }
    visited.add(typeId);

    // Primitives and literals
    if (
        type.isString() ||
        type.isNumber() ||
        type.isBoolean() ||
        type.isUndefined() ||
        type.isNull() ||
        type.isLiteral() ||
        type.isAny() ||
        type.isUnknown() ||
        type.isNever()
    ) {
        return type.getText();
    }

    // String/number/boolean literal types
    if (type.isStringLiteral() || type.isNumberLiteral() || type.isBooleanLiteral()) {
        return type.getText();
    }

    // Arrays
    if (type.isArray()) {
        const elementType = type.getArrayElementType();
        if (elementType) {
            const inner = inlineType(elementType, {
                maxProps,
                maxDepth,
                currentDepth: currentDepth + 1,
                visited,
                indent,
            });
            return inner + "[]";
        }
    }

    // Union types
    if (type.isUnion()) {
        const parts = type.getUnionTypes().map(t =>
            inlineType(t, {
                maxProps,
                maxDepth,
                currentDepth: currentDepth + 1,
                visited,
                indent,
            })
        );
        return parts.join(" | ");
    }

    // Intersection types
    if (type.isIntersection()) {
        const parts = type.getIntersectionTypes().map(t =>
            inlineType(t, {
                maxProps,
                maxDepth,
                currentDepth: currentDepth + 1,
                visited,
                indent,
            })
        );
        return parts.join(" & ");
    }

    // Object types / interfaces
    if (type.isObject()) {
        const properties = type.getProperties();
        if (properties.length === 0) {
            // Check if it's a function type
            const callSignatures = type.getCallSignatures();
            if (callSignatures.length > 0) {
                return type.getText();
            }
            return "{}";
        }

        const prefix = indent.repeat(currentDepth + 1);
        const lines: string[] = [];

        const propsToShow = properties.slice(0, maxProps);
        const remaining = properties.length - propsToShow.length;

        for (const prop of propsToShow) {
            const name = prop.getName();
            const propType = prop.getTypeAtLocation(prop.getValueDeclaration() || prop.getDeclarations()[0]);
            const isOptional = prop.isOptional();
            const question = isOptional ? "?" : "";
            const inlined = inlineType(propType, {
                maxProps,
                maxDepth,
                currentDepth: currentDepth + 1,
                visited: new Set(visited),
                indent,
            });
            lines.push(prefix + name + question + ": " + inlined + ";");
        }

        if (remaining > 0) {
            lines.push(prefix + "// ... " + remaining + " more properties");
        }

        const closingIndent = indent.repeat(currentDepth);
        return "{\n" + lines.join("\n") + "\n" + closingIndent + "}";
    }

    // Fallback: use getText()
    return type.getText();
}

/**
 * Resolve the payload type of a DomainEvent subclass.
 * Looks for: class FooEvent extends DomainEvent<PayloadInterface> { ... }
 * Returns the stringified payload interface.
 */
export function resolveEventPayload(
    sourceFile: SourceFile,
    eventClassName: string
): string {
    const eventClass = sourceFile.getClass(eventClassName);
    if (!eventClass) return "unknown";

    const extendsExpr = eventClass.getExtends();
    if (!extendsExpr) return "unknown";

    // Get the type argument of DomainEvent<Payload>
    const typeArgs = extendsExpr.getTypeArguments();
    if (typeArgs.length === 0) return "unknown";

    const payloadTypeName = typeArgs[0].getText();

    // Try to find the payload interface in the same file
    const payloadInterface = sourceFile.getInterface(payloadTypeName);
    if (payloadInterface) {
        return payloadInterface.getText();
    }

    // Fallback: return the type name
    return payloadTypeName;
}

/**
 * Compute SHA-256 hash of a string.
 */
export function computeHash(content: string): string {
    return createHash("sha256").update(content).digest("hex");
}

/**
 * Extract package name and relative file path from a source file.
 */
export function getSourceInfo(sourceFile: SourceFile): { package: string; file: string } {
    const filePath = sourceFile.getFilePath();
    // Match: .../packages/{packageName}/src/...
    const match = filePath.match(/packages\/([^/]+)\/src\/(.+)/);
    if (match) {
        return {
            package: "@webiny/" + match[1],
            file: "src/" + match[2],
        };
    }
    return {
        package: "unknown",
        file: filePath,
    };
}

/**
 * Create a ts-morph Project configured with the webiny tsconfig.
 */
export function createProject(repoRoot: string): Project {
    const tsConfigPath = path.join(repoRoot, "packages/webiny/tsconfig.json");
    return new Project({
        tsConfigFilePath: tsConfigPath,
        skipAddingFilesFromTsConfig: false,
    });
}

/**
 * Create a TypeUtils object for plugins to use.
 */
export function createTypeUtils(): TypeUtils {
    return {
        followReExport,
        extractNamespaceTypes,
        inlineType,
        computeHash,
        getSourceInfo,
        resolveEventPayload,
    };
}
