import { ApolloLink } from "apollo-link";
import { DocumentNode } from "graphql";
import { ApolloLinkPlugin } from "./ApolloLinkPlugin";
import { ExecutableDefinitionNode, FieldNode } from "graphql/language/ast";

interface Config {
    operationName: string;
    selectionPath: string;
    addSelection: DocumentNode;
}

export class AddQuerySelectionPlugin extends ApolloLinkPlugin {
    private readonly config: Config;

    constructor(config: Config) {
        super();
        this.config = config;
    }

    public override createLink(): ApolloLink {
        return new ApolloLink((operation, forward) => {
            if (operation.operationName !== this.config.operationName) {
                return forward(operation);
            }

            this.addSelectionToQuery(operation.operationName, operation.query);

            return forward(operation);
        });
    }

    public addSelectionToQuery(operationName: string, query: DocumentNode): void {
        if (operationName !== this.config.operationName) {
            return;
        }

        const { addSelection, selectionPath } = this.config;

        // TODO: check if the selection is already in the query and don't add it again if not necessary.

        const firstQueryDefinition = query.definitions[0] as ExecutableDefinitionNode;
        if (!firstQueryDefinition) {
            return;
        } else if (!firstQueryDefinition.selectionSet) {
            return;
        }

        let tree = firstQueryDefinition.selectionSet.selections as FieldNode[];
        const fields = selectionPath.split(".");

        fieldLoop: for (const field of fields) {
            for (const selection of tree) {
                if (!selection.selectionSet) {
                    continue;
                }
                if (selection.name.value === field) {
                    tree = selection.selectionSet.selections as FieldNode[];
                    continue fieldLoop;
                }
            }
            // If we get here, it means we didn't find the necessary selection
            return;
        }
        /**
         * We must cast because there are a lot of types that are not intertwined and TS is complaining
         */
        tree.push(
            ...((addSelection.definitions[0] as ExecutableDefinitionNode).selectionSet
                .selections as FieldNode[])
        );
    }
}
