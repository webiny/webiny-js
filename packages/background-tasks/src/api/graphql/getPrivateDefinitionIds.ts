export interface IDefinitionPrivacy {
    id: string;
    isPrivate?: boolean;
}

/**
 * The ids of the private task definitions (R180). A pure function over plain data: the resolvers
 * read the registered definitions with `ListTaskDefinitionsUseCase` themselves and pass them in.
 * A task whose definition is not in the list (no longer registered) is not private.
 */
export const getPrivateDefinitionIds = (
    definitions: ReadonlyArray<IDefinitionPrivacy>
): string[] => {
    return definitions.filter(definition => definition.isPrivate === true).map(item => item.id);
};
