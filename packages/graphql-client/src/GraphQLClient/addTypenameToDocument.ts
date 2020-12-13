import { DocumentNode, SelectionNode, OperationDefinitionNode, FieldNode, visit } from "graphql";

const TYPENAME_FIELD: FieldNode = {
    kind: "Field",
    name: {
        kind: "Name",
        value: "__typename"
    }
};

export function isField(selection: SelectionNode): selection is FieldNode {
    return selection.kind === "Field";
}

export default (doc: DocumentNode): DocumentNode => {
    return visit(doc, {
        SelectionSet: {
            enter(node, _key, parent) {
                // Don't add __typename to OperationDefinitions.
                if (parent && (parent as OperationDefinitionNode).kind === "OperationDefinition") {
                    return;
                }

                // No changes if no selections.
                const { selections } = node;
                if (!selections) {
                    return;
                }

                // If selections already have a __typename, or are part of an
                // introspection query, do nothing.
                const skip = selections.some(selection => {
                    return (
                        isField(selection) &&
                        (selection.name.value === "__typename" ||
                            selection.name.value.lastIndexOf("__", 0) === 0)
                    );
                });
                if (skip) {
                    return;
                }

                // If this SelectionSet is @export-ed as an input variable, it should
                // not have a __typename field (see issue #4691).
                const field = parent as FieldNode;
                if (
                    isField(field) &&
                    field.directives &&
                    field.directives.some(d => d.name.value === "export")
                ) {
                    return;
                }

                // Create and return a new SelectionSet with a __typename Field.
                return {
                    ...node,
                    selections: [...selections, TYPENAME_FIELD]
                };
            }
        }
    });
};
