export class AddQuerySelectionPlugin {
    type = "apollo-link-operation";
    
    private config;

    constructor(config) {
        this.config = config;
    }
    
    get operationName() {
        return this.config.operationName;
    }

    operation(operation) {
        const { addSelection, selectionPath } = this.config;
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

        tree.push(...addSelection.definitions[0].selectionSet.selections);
    }
}
