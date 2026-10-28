import type {
    DocumentNode,
    EnumTypeDefinitionNode,
    FieldDefinitionNode,
    InputObjectTypeDefinitionNode,
    InputValueDefinitionNode,
    ObjectTypeDefinitionNode,
    TypeNode
} from "graphql";
import { Kind, parse, print } from "graphql";
import type { CmsModel } from "~/types/index.js";

/**
 * Turns the v6 GraphQL schema of a single model into the shape v5 clients expect.
 *
 * In v6, model field values live under a `values` wrapper, in the output type, in the input,
 * and in the where inputs, and sorters are prefixed with `values_`. In v5 they were all on the
 * root. Rather than keeping a second set of SDL templates, this takes the generated v6 SDL and
 * resolvers and lifts every `XValues` type back onto `X`. The resolvers stay the v6 ones; only the
 * arguments are translated before they reach them.
 */

type Resolver = (parent: any, args: any, context: any, info: any) => any;
type ResolverMap = Record<string, Record<string, Resolver> | any>;

interface TransformModelSchemaParams {
    model: CmsModel;
    typeDefs: string;
    resolvers: ResolverMap;
    endpoint: "manage" | "read" | "preview";
}

interface TransformModelSchemaResult {
    typeDefs: string;
    resolvers: ResolverMap;
    /**
     * Model fields (and sorters) left out because their name is taken by a root field.
     */
    conflicts: string[];
}

type FieldLike = FieldDefinitionNode | InputValueDefinitionNode;
type TypeWithFields = ObjectTypeDefinitionNode | InputObjectTypeDefinitionNode;

const VALUES_FIELD = "values";
const EMPTY_FIELD = "_empty";

const unwrapNamedType = (type: TypeNode): string | null => {
    if (type.kind === Kind.NAMED_TYPE) {
        return type.name.value;
    }
    if (type.kind === Kind.NON_NULL_TYPE) {
        return unwrapNamedType(type.type);
    }
    return null;
};

const isTypeWithFields = (definition: any): definition is TypeWithFields => {
    return (
        definition.kind === Kind.OBJECT_TYPE_DEFINITION ||
        definition.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION
    );
};

export const transformModelSchema = (
    params: TransformModelSchemaParams
): TransformModelSchemaResult => {
    const { model, endpoint } = params;
    const { singularApiName: singularName } = model;

    const document = parse(params.typeDefs) as DocumentNode;
    const definitions = [...document.definitions];

    const byName = new Map<string, TypeWithFields>();
    for (const definition of definitions) {
        if (isTypeWithFields(definition)) {
            byName.set(definition.name.value, definition);
        }
    }

    /**
     * For every type which has a `values: <Type>Values` field, we remember which field names were
     * lifted onto it, so the resolvers can move the matching arguments back under `values`.
     */
    const liftedFields = new Map<string, Set<string>>();
    const removedTypes = new Set<string>();
    const conflicts = new Set<string>();

    const liftValues = (definition: TypeWithFields): TypeWithFields => {
        const fields = (definition.fields || []) as readonly FieldLike[];
        const valuesField = fields.find(field => field.name.value === VALUES_FIELD);
        if (!valuesField) {
            return definition;
        }
        const valuesTypeName = unwrapNamedType(valuesField.type);
        if (valuesTypeName !== `${definition.name.value}Values`) {
            return definition;
        }
        const valuesType = byName.get(valuesTypeName);
        if (!valuesType) {
            return definition;
        }
        /**
         * v6 does not reserve field IDs like `status`, `live` or `revisionDescription`, since model
         * fields live under `values`. Lifting such a field would duplicate a root field and break
         * the schema of the whole endpoint, so the root field wins and the model field is left out.
         */
        const rootFieldNames = new Set(fields.map(field => field.name.value));
        const lifted = ((valuesType.fields || []) as readonly FieldLike[]).filter(field => {
            const name = field.name.value;
            if (name === EMPTY_FIELD) {
                return false;
            }
            if (rootFieldNames.has(name)) {
                conflicts.add(`${definition.name.value}.${name}`);
                return false;
            }
            return true;
        });

        liftedFields.set(definition.name.value, new Set(lifted.map(field => field.name.value)));
        removedTypes.add(valuesTypeName);

        const nextFields: FieldLike[] = [];
        for (const field of fields) {
            if (field === valuesField) {
                nextFields.push(...lifted);
                continue;
            }
            nextFields.push(field);
        }

        return {
            ...definition,
            fields: nextFields
        } as TypeWithFields;
    };

    const renamedSorters = new Map<string, string>();
    const sorterEnumName = `${singularName}ListSorter`;

    const unprefixSorters = (definition: EnumTypeDefinitionNode): EnumTypeDefinitionNode => {
        const existing = new Set((definition.values || []).map(value => value.name.value));
        return {
            ...definition,
            values: (definition.values || []).map(value => {
                const name = value.name.value;
                if (!name.startsWith(`${VALUES_FIELD}_`)) {
                    return value;
                }
                const v5Name = name.slice(VALUES_FIELD.length + 1);
                if (existing.has(v5Name)) {
                    conflicts.add(`${sorterEnumName}.${v5Name}`);
                    return value;
                }
                renamedSorters.set(v5Name, name);
                return {
                    ...value,
                    name: { ...value.name, value: v5Name }
                };
            })
        };
    };

    const transformed = definitions
        .map(definition => {
            if (isTypeWithFields(definition)) {
                return liftValues(definition);
            }
            if (
                definition.kind === Kind.ENUM_TYPE_DEFINITION &&
                definition.name.value === sorterEnumName
            ) {
                return unprefixSorters(definition);
            }
            return definition;
        })
        .filter(definition => {
            return !isTypeWithFields(definition) || !removedTypes.has(definition.name.value);
        });

    let typeDefs = print({ ...document, definitions: transformed });

    /**
     * Fields which were removed in v6, but v5 clients may still select.
     */
    typeDefs += `
        extend type ${singularName} {
            publishedOn: DateTime @deprecated(reason: "Use 'firstPublishedOn' or 'lastPublishedOn'.")
            ownedBy: CmsIdentity @deprecated(reason: "Use 'createdBy'.")
        }
    `;
    /**
     * v5 had `getXById` on the read and preview APIs. Single-entry models have no `where` on
     * their get query, so there is nothing to map it to.
     */
    const hasGetById = endpoint !== "manage" && /get\w+\(\s*where:/.test(params.typeDefs);
    if (hasGetById) {
        typeDefs += `
            extend type Query {
                get${singularName}ById(id: ID!): ${singularName}Response
            }
        `;
    }

    const resolvers = transformResolvers({
        model,
        resolvers: params.resolvers,
        liftedFields,
        renamedSorters,
        hasGetById
    });

    return { typeDefs, resolvers, conflicts: Array.from(conflicts) };
};

interface TransformResolversParams {
    model: CmsModel;
    resolvers: ResolverMap;
    liftedFields: Map<string, Set<string>>;
    renamedSorters: Map<string, string>;
    hasGetById: boolean;
}

const transformResolvers = (params: TransformResolversParams): ResolverMap => {
    const { model, liftedFields, renamedSorters, hasGetById } = params;
    const { singularApiName: singularName } = model;

    const resolvers: ResolverMap = { ...params.resolvers };

    /**
     * Field resolvers of the `XValues` type move to `X`. They already read from `parent.values`
     * when it exists, so they work unchanged on the root type.
     */
    const valuesTypeName = `${singularName}Values`;
    if (resolvers[valuesTypeName]) {
        resolvers[singularName] = {
            ...resolvers[singularName],
            ...resolvers[valuesTypeName]
        };
        delete resolvers[valuesTypeName];
    }

    resolvers[singularName] = {
        ...resolvers[singularName],
        publishedOn: (entry: any) => entry.lastPublishedOn || null,
        ownedBy: (entry: any) => entry.createdBy || null
    };

    const inputFields = liftedFields.get(`${singularName}Input`) || new Set<string>();
    const whereFields = new Set<string>([
        ...(liftedFields.get(`${singularName}GetWhereInput`) || []),
        ...(liftedFields.get(`${singularName}ListWhereInput`) || [])
    ]);

    const translateArgs = (args: Record<string, any>) => {
        const next = { ...args };
        if (next.data) {
            next.data = moveUnderValues(next.data, inputFields);
        }
        if (next.where) {
            next.where = translateWhere(next.where, whereFields);
        }
        if (Array.isArray(next.sort)) {
            next.sort = next.sort.map((sorter: string) => renamedSorters.get(sorter) || sorter);
        }
        return next;
    };

    const wrap = (resolver: Resolver): Resolver => {
        return (parent, args, context, info) => {
            return resolver(parent, translateArgs(args || {}), context, info);
        };
    };

    for (const operation of ["Query", "Mutation"]) {
        const map = resolvers[operation];
        if (!map) {
            continue;
        }
        resolvers[operation] = Object.fromEntries(
            Object.entries(map).map(([name, resolver]) => [name, wrap(resolver as Resolver)])
        );
    }

    if (hasGetById) {
        const get = resolvers.Query?.[`get${singularName}`] as Resolver | undefined;
        if (get) {
            resolvers.Query[`get${singularName}ById`] = (
                parent: any,
                args: { id: string },
                context: any,
                info: any
            ) => {
                return get(parent, { where: { id: args.id } }, context, info);
            };
        }
    }

    return resolvers;
};

const moveUnderValues = (input: Record<string, any>, fields: Set<string>) => {
    const result: Record<string, any> = {};
    const values: Record<string, any> = { ...(input.values || {}) };
    for (const key in input) {
        if (key === VALUES_FIELD) {
            continue;
        } else if (fields.has(key)) {
            values[key] = input[key];
            continue;
        }
        result[key] = input[key];
    }
    if (Object.keys(values).length > 0) {
        result.values = values;
    }
    return result;
};

const translateWhere = (where: Record<string, any>, fields: Set<string>): Record<string, any> => {
    const result = moveUnderValues(where, fields);
    for (const operator of ["AND", "OR"]) {
        if (Array.isArray(result[operator])) {
            result[operator] = result[operator].map((item: Record<string, any>) => {
                return translateWhere(item, fields);
            });
        }
    }
    return result;
};
