import { getOperationAST, parse, print, type DocumentNode } from "graphql";
import { GraphQLClient } from "./abstractions.js";

export class RequestValue {
    private readonly _operationName: string | undefined;
    private readonly _queryAsString: string;
    private readonly _queryAsDocumentNode: DocumentNode;
    private readonly _request: GraphQLClient.Request;

    static from(value: GraphQLClient.Request) {
        return new RequestValue(value);
    }

    private constructor(readonly value: GraphQLClient.Request) {
        this._request = value;
        if (typeof value.query === "string") {
            this._queryAsString = value.query;
            this._queryAsDocumentNode = parse(value.query);
        } else {
            this._queryAsString = print(value.query);
            this._queryAsDocumentNode = value.query;
        }

        this._operationName = this.getOperationName(this._queryAsDocumentNode);
    }

    get request() {
        return this._request;
    }

    get variables() {
        return this._request.variables;
    }

    get queryAsString() {
        return this._queryAsString;
    }

    get queryAsDocumentNode() {
        return this._queryAsDocumentNode;
    }

    get headers() {
        return this._request.headers;
    }

    get operationName() {
        return this._operationName;
    }

    private getOperationName(query: DocumentNode): string | undefined {
        const operationAST = getOperationAST(query, undefined);
        return operationAST?.name?.value;
    }
}
