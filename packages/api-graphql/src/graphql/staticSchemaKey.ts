/**
 * Schema key for a factory whose type definitions and resolver paths never change. The id only has
 * to be unique among factories.
 */
export const staticSchemaKey = (id: string) => {
    return (): string => `static:${id}`;
};
