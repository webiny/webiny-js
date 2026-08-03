import { z } from "zod";
import { META_EXTENSION, MODES_EXTENSION, type TokenDocument, type TokenNode } from "./types.js";

/**
 * Structural validation of a token document.
 *
 * This checks shape, not semantics — that a node is a well-formed token or group, that names are
 * legal, that `$type` is one we understand. Whether aliases resolve, whether canonical slots are
 * filled, and whether values are accessible are separate concerns, handled by the resolver and the
 * a11y checks.
 */

export const tokenTypeSchema = z.enum([
    "color",
    "dimension",
    "fontFamily",
    "fontWeight",
    "number",
    "duration",
    "cubicBezier",
    "shadow",
    "typography"
]);

const fluidStepSchema = z.object({
    min: z.string(),
    max: z.string(),
    enabled: z.boolean()
});

const modesExtensionSchema = z.object({
    dark: z.unknown().optional()
});

const metaExtensionSchema = z.object({
    key: z.string().optional(),
    displayName: z.string().optional(),
    deprecated: z.boolean().optional(),
    lastResolvedValue: z.unknown().optional(),
    fluid: fluidStepSchema.optional()
});

const extensionsSchema = z
    .object({
        [MODES_EXTENSION]: modesExtensionSchema.optional(),
        [META_EXTENSION]: metaExtensionSchema.optional()
    })
    .catchall(z.unknown());

const shadowLayerSchema = z.object({
    color: z.string(),
    offsetX: z.string(),
    offsetY: z.string(),
    blur: z.string(),
    spread: z.string(),
    inset: z.boolean().optional()
});

const typographyValueSchema = z.object({
    fontFamily: z.union([z.string(), z.array(z.string())]),
    fontSize: z.string(),
    fontWeight: z.union([z.number(), z.string()]),
    lineHeight: z.union([z.number(), z.string()]),
    letterSpacing: z.string()
});

export const tokenValueSchema = z.union([
    z.string(),
    z.number(),
    z.array(z.string()),
    z.tuple([z.number(), z.number(), z.number(), z.number()]),
    shadowLayerSchema,
    z.array(shadowLayerSchema),
    typographyValueSchema
]);

const designTokenSchema = z.object({
    $value: tokenValueSchema,
    $type: tokenTypeSchema.optional(),
    $description: z.string().optional(),
    $extensions: extensionsSchema.optional()
});

/**
 * DTCG reserves `.` as the path separator and `{}` as the alias delimiters, so a name containing
 * either would make the token unaddressable. `$`-prefixed keys are metadata, not names.
 */
const NAME_PATTERN = /^[^.{}$]+$/;

const tokenNodeSchema: z.ZodType<TokenNode> = z.lazy(() =>
    z.union([designTokenSchema, tokenGroupSchema])
) as z.ZodType<TokenNode>;

const tokenGroupSchema = z
    .object({
        $type: tokenTypeSchema.optional(),
        $description: z.string().optional(),
        $extensions: extensionsSchema.optional()
    })
    .catchall(tokenNodeSchema)
    .superRefine((group, ctx) => {
        for (const name of Object.keys(group)) {
            if (name.startsWith("$")) {
                continue;
            }
            if (!NAME_PATTERN.test(name)) {
                ctx.addIssue({
                    code: "custom",
                    path: [name],
                    message: `"${name}" is not a valid token name — names cannot contain ".", "{", "}" or start with "$".`
                });
            }
        }
    });

export const tokenDocumentSchema = tokenGroupSchema;

export interface TokenDocumentIssue {
    /** Dot-joined path to the offending node. */
    path: string;
    message: string;
}

export type ValidateTokenDocumentResult =
    | { valid: true; document: TokenDocument }
    | { valid: false; issues: TokenDocumentIssue[] };

/**
 * Non-throwing structural validation. Returns every issue rather than the first, because publish
 * validation reports them as a list the editor links from.
 */
export const validateTokenDocument = (input: unknown): ValidateTokenDocumentResult => {
    const result = tokenDocumentSchema.safeParse(input);

    if (result.success) {
        return { valid: true, document: result.data as TokenDocument };
    }

    return {
        valid: false,
        issues: result.error.issues.map(issue => ({
            path: issue.path.join("."),
            message: issue.message
        }))
    };
};
