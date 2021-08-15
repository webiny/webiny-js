import { ApolloLink } from "apollo-link";
import { DocumentNode } from "graphql";
import { ApolloLinkPlugin } from "./ApolloLinkPlugin";

interface Config {
    operationName: string;
    selectionPath: string;
    addSelection: DocumentNode;
}

export class AddQuerySelectionPlugin extends ApolloLinkPlugin {
    private config: Config;

    constructor(config: Config) {
        super();
        this.config = config;
    }

    createLink() {
        return new ApolloLink((operation, forward) => {
            if (operation.operationName !== this.config.operationName) {
                return forward(operation);
            }

            const { addSelection, selectionPath } = this.config;
            // @ts-ignore
            let tree = operation.query.definitions[0].selectionSet.selections;
            const fields = selectionPath.split(".");

            fieldLoop: for (const field of fields) {
                for (const selection of tree) {
                    if (selection.name.value === field) {
                        tree = selection.selectionSet.selections;
                        continue fieldLoop;
                    }
                }
                // If we get here, it means we didn't find the necessary selection
                return;
            }

            // @ts-ignore
            tree.push(...addSelection.definitions[0].selectionSet.selections);

            return forward(operation);
        });
    }
}
