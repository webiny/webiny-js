import { Operation, Selection, Variable } from "./components";

export const generateQuery = (operation: Operation): string => {
    const generator = new GraphQLQueryGenerator();
    return generator.generateQueryFromOperation(operation);
};

interface IQueryGenerator {
    generateQueryFromOperation(operation: Operation): string;
}

class GraphQLQueryGenerator implements IQueryGenerator {
    generateQueryFromOperation(operation: Operation): string {
        return this.generateOperation(operation);
    }

    private generateOperation(operation: Operation): string {
        let variables = "";
        if (operation.variables) {
            variables = `(${operation.variables
                .map(variable => this.generateOperationVariable(variable))
                .join(", ")})`;
        }

        return `${operation.type} ${operation.operationName}${variables} {
            ${operation.selection.map(selection => this.generateSelection(selection)).join("\n")}
        }`;
    }

    private generateSelection(selection: Selection): string {
        let variables = "";
        if (selection.variables) {
            variables = `(${selection.variables
                .map(variable => this.generateSelectionVariable(variable))
                .join(", ")})`;
        }

        let subselection = "";
        if (selection.selection) {
            subselection = `{${selection.selection
                .map(selection => this.generateSelection(selection))
                .join("\n")}}`;
        }

        let name = selection.alias ? `${selection.alias}: ${selection.name}` : selection.name;
        if (selection.type === "inlineFragment") {
            name = `... on ${selection.name}`;
        }

        return `${name}${variables}${subselection}`;
    }

    private generateOperationVariable(variable: Variable): string {
        return `$${variable.name}: ${variable.type}${variable.required ? "!" : ""}`;
    }

    private generateSelectionVariable(variable: Variable): string {
        return `${variable.name}: $${variable.alias ?? variable.name}`;
    }
}
