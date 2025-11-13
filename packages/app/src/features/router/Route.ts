import { z } from "zod";

export type RouteParamsDefinition = Record<string, z.ZodTypeAny>;

export type RouteParamsInfer<T extends RouteParamsDefinition | undefined> =
    T extends RouteParamsDefinition ? z.infer<z.ZodObject<T> & { [k: string]: any }> : never;

export interface RouteParams<TParams extends RouteParamsDefinition | undefined> {
    name: string;
    path: `/${string}` | `*`;
    params?: (zod: typeof z) => TParams;
}

export class Route<TParams extends RouteParamsDefinition | undefined = undefined> {
    private readonly route: RouteParams<TParams>;
    private readonly schema: TParams extends RouteParamsDefinition
        ? RouteParamsInfer<TParams>
        : undefined;

    constructor(route: RouteParams<TParams>) {
        this.route = route;
        const paramsSchema = route.params ? route.params(z) : undefined;
        // @ts-expect-error
        this.schema = paramsSchema
            ? z.object(this.coerceParams(paramsSchema)).passthrough()
            : undefined;
    }

    get name() {
        return this.route.name;
    }

    get path() {
        return this.route.path;
    }

    get params(): TParams extends RouteParamsDefinition ? RouteParamsInfer<TParams> : undefined {
        return this.schema;
    }

    private coerceParams<T extends Record<string, z.ZodTypeAny>>(shape: T) {
        const result: Record<string, z.ZodTypeAny> = {};
        for (const [key, schema] of Object.entries(shape)) {
            let base = schema as z.ZodTypeAny;
            let isOptional = false;
            let isNullable = false;

            // unwrap optional
            if (base._def.typeName === z.ZodFirstPartyTypeKind.ZodOptional) {
                isOptional = true;
                base = base._def.innerType;
            }

            // unwrap nullable
            if (base._def.typeName === z.ZodFirstPartyTypeKind.ZodNullable) {
                isNullable = true;
                base = base._def.innerType;
            }

            // replace with coerced
            if (base instanceof z.ZodString) {
                base = z.coerce.string();
            } else if (base instanceof z.ZodNumber) {
                base = z.coerce.number();
            } else if (base instanceof z.ZodBoolean) {
                base = z.coerce.boolean();
            }

            // rewrap optional/nullable
            if (isNullable) {
                base = base.nullable();
            }
            if (isOptional) {
                base = base.optional();
            }

            result[key] = base;
        }
        return result;
    }
}
