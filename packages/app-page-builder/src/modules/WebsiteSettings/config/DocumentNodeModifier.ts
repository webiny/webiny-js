import { DocumentNode } from "graphql";
import { ExecutableDefinitionNode, FieldNode, OperationDefinitionNode } from "graphql/language/ast";

declare module "graphql" {
    interface DocumentNode {
        __cacheKey: string;
    }
}

let documentNodeModifier: DocumentNodeModifier;

class DocumentNodeModifier {
    private cache = new Map<string, DocumentNode>();

    public augmentDocument(
        document: DocumentNode,
        selectionPath: string,
        selections: DocumentNode[]
    ) {
        const cacheKey = this.createCacheKey(document, selections);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey) as DocumentNode;
        }

        const NEW_QUERY = structuredClone(document);
        selections.forEach(selection => {
            this.addSelectionToQuery(NEW_QUERY, selectionPath, selection);
        });

        this.cache.set(cacheKey, NEW_QUERY);

        return NEW_QUERY;
    }

    public addSelectionToQuery(
        document: DocumentNode,
        selectionPath: string,
        addSelection: DocumentNode
    ): void {
        const firstQueryDefinition = document.definitions[0] as ExecutableDefinitionNode;
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

    private createCacheKey(document: DocumentNode, selections: DocumentNode[]) {
        const def = document.definitions[0] as OperationDefinitionNode;
        const operationName = def.name?.value;
        return [operationName, ...selections.map(node => node.__cacheKey)].join(":");
    }
}

export function createDocumentNodeModifier() {
    if (!documentNodeModifier) {
        documentNodeModifier = new DocumentNodeModifier();
    }

    return documentNodeModifier;
}
