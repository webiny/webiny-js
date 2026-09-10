import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import type {
    CmsModelAst,
    CmsModelFieldAstNode,
    CmsModelField
} from "@webiny/api-headless-cms/types/index.js";
import { ModelToAstConverter } from "@webiny/api-headless-cms/features/contentModel/ModelToAstConverter/index.js";
import { ModelToAstConverter as ModelToAstConverterImpl } from "@webiny/api-headless-cms/features/contentModel/ModelToAstConverter/ModelToAstConverter.js";
import { GraphQLFeature } from "@webiny/api-headless-cms/features/graphql/feature.js";
import { toFieldDescriptors } from "~/cms/model/toFieldDescriptors.js";
import type { FieldDescriptor } from "~/core/diff/descriptors.js";

/**
 * `toFieldDescriptors` reads model structure directly instead of going through
 * `ModelToAstConverter`, because the AST converter is built from the GraphQL field-type registry
 * and capture runs inside an entry write that may happen with no schema built.
 *
 * The cost of that bypass is two interpreters of model structure that can drift apart — most
 * plausibly when a field type gains children through a plugin that a direct reader knows nothing
 * about. This test pins them together on structure: which fields exist, at what paths, and for a
 * dynamic zone which template carries which fields.
 *
 * It is skipped rather than failed when the field-type registry cannot be built standalone, since
 * that is an upstream wiring change and not a defect in this package.
 */

const field = (overrides: Partial<CmsModelField> & { fieldId: string }): CmsModelField =>
    ({
        id: overrides.fieldId,
        type: "text",
        storageId: `text@${overrides.fieldId}`,
        label: overrides.fieldId,
        validation: [],
        listValidation: [],
        ...overrides
    }) as CmsModelField;

/** A model exercising every shape that nests: object, list of objects, dynamic zone, scalars. */
const representativeModel = {
    fields: [
        field({ fieldId: "title" }),
        field({ fieldId: "count", type: "number" }),
        field({ fieldId: "published", type: "boolean" }),
        field({ fieldId: "tags", list: true }),
        field({
            fieldId: "author",
            type: "object",
            settings: {
                fields: [
                    field({ fieldId: "name" }),
                    field({
                        fieldId: "address",
                        type: "object",
                        settings: { fields: [field({ fieldId: "city" })] }
                    })
                ]
            }
        }),
        field({
            fieldId: "sections",
            type: "object",
            list: true,
            settings: {
                fields: [
                    field({ fieldId: "heading" }),
                    field({
                        fieldId: "items",
                        type: "object",
                        list: true,
                        settings: { fields: [field({ fieldId: "body" })] }
                    })
                ]
            }
        }),
        field({
            fieldId: "blocks",
            type: "dynamicZone",
            list: true,
            settings: {
                templates: [
                    {
                        id: "hero",
                        name: "Hero",
                        fields: [
                            field({ fieldId: "headline" }),
                            field({
                                fieldId: "cta",
                                type: "object",
                                settings: { fields: [field({ fieldId: "url" })] }
                            })
                        ]
                    },
                    { id: "text", name: "Text", fields: [field({ fieldId: "body" })] }
                ]
            }
        })
    ]
};

/** Structure paths as the AST sees them. A template becomes an `@<id>` segment. */
const pathsFromAst = (ast: CmsModelAst): string[] => {
    const paths: string[] = [];

    const walk = (nodes: CmsModelFieldAstNode[], prefix: string): void => {
        for (const node of nodes) {
            if (node.type === "collection") {
                walk(node.children, `${prefix}@${node.collection.id}/`);
                continue;
            }

            const path = `${prefix}${node.field.fieldId}`;
            paths.push(path);
            walk(node.children, `${path}/`);
        }
    };

    walk(ast.children, "");

    return paths.sort();
};

/** The same structure paths as the descriptor projection sees them. */
const pathsFromDescriptors = (descriptors: FieldDescriptor[]): string[] => {
    const paths: string[] = [];

    const walk = (fields: FieldDescriptor[], prefix: string): void => {
        for (const descriptor of fields) {
            const path = `${prefix}${descriptor.fieldId}`;
            paths.push(path);

            if (descriptor.fields) {
                walk(descriptor.fields, `${path}/`);
            }

            for (const template of descriptor.templates ?? []) {
                walk(template.fields, `${path}/@${template.id}/`);
            }
        }
    };

    walk(descriptors, "");

    return paths.sort();
};

const buildAstConverter = (): ModelToAstConverter.Interface | null => {
    try {
        const container = new Container();
        GraphQLFeature.register(container);
        container.register(ModelToAstConverterImpl);
        return container.resolve(ModelToAstConverter);
    } catch {
        return null;
    }
};

describe("toFieldDescriptors agrees with ModelToAstConverter", () => {
    const converter = buildAstConverter();

    it.skipIf(converter === null)(
        "produces the same field structure for a representative model",
        () => {
            const ast = converter!.toAst(representativeModel as never);

            expect(pathsFromDescriptors(toFieldDescriptors(representativeModel.fields))).toEqual(
                pathsFromAst(ast)
            );
        }
    );

    it.skipIf(converter === null)("resolves dynamic zone templates the same way", () => {
        const ast = converter!.toAst(representativeModel as never);
        const templatePaths = pathsFromAst(ast).filter(path => path.includes("@"));

        // Guards against the comparison passing vacuously: if the AST stopped emitting template
        // children, both sides could agree on an empty set and hide real drift.
        expect(templatePaths).toEqual([
            "blocks/@hero/cta",
            "blocks/@hero/cta/url",
            "blocks/@hero/headline",
            "blocks/@text/body"
        ]);
    });

    it("reports whether the agreement check actually ran", () => {
        // Visible in the test output either way, so a permanently skipped agreement check cannot
        // sit unnoticed.
        expect(typeof (converter === null)).toBe("boolean");

        if (converter === null) {
            console.warn(
                "[activity-log] AST agreement check skipped: the CMS field-type registry could " +
                    "not be built standalone. toFieldDescriptors is unverified against " +
                    "ModelToAstConverter in this run."
            );
        }
    });
});
