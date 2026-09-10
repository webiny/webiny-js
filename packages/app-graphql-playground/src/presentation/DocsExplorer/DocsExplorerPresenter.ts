import { makeAutoObservable } from "mobx";
import { DocsExplorerPresenter } from "./abstractions.js";

interface IIntrospectionType {
    name: string;
    kind: string;
    description: string | null;
    fields: any[];
    inputFields: any[];
    enumValues: any[];
    interfaces: any[];
    possibleTypes: any[];
}

interface IUnwrappedTypeRef {
    name: string;
    displayName: string;
}

const NON_NAVIGABLE_KINDS = new Set(["SCALAR"]);

class DocsExplorerPresenterImpl implements DocsExplorerPresenter.Interface {
    private readonly typeMap = new Map<string, IIntrospectionType>();

    private isOpen = false;
    private status: DocsExplorerPresenter.SchemaStatus = "idle";
    private search = "";
    private navigationStack: string[] = [];
    private rootTypeNames: string[] = [];

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    public get vm(): DocsExplorerPresenter.Vm {
        return {
            open: this.isOpen,
            schemaStatus: this.status,
            searchQuery: this.search,
            breadcrumbs: [...this.navigationStack],
            currentView: this.buildCurrentView()
        };
    }

    public toggle(): void {
        this.isOpen = !this.isOpen;
    }

    public setSchema(
        schema: Record<string, any> | null,
        status: DocsExplorerPresenter.SchemaStatus
    ): void {
        this.status = status;
        this.navigationStack = [];
        this.search = "";
        this.typeMap.clear();
        this.rootTypeNames = [];

        if (!schema) {
            return;
        }

        const types: any[] = schema.types || [];
        for (const type of types) {
            if (type.name.startsWith("__")) {
                continue;
            }

            this.typeMap.set(type.name, {
                name: type.name,
                kind: type.kind,
                description: type.description || null,
                fields: type.fields || [],
                inputFields: type.inputFields || [],
                enumValues: type.enumValues || [],
                interfaces: type.interfaces || [],
                possibleTypes: type.possibleTypes || []
            });
        }

        if (schema.queryType) {
            this.rootTypeNames.push(schema.queryType.name);
        }

        if (schema.mutationType) {
            this.rootTypeNames.push(schema.mutationType.name);
        }

        if (schema.subscriptionType) {
            this.rootTypeNames.push(schema.subscriptionType.name);
        }
    }

    public navigateToType(name: string): void {
        const type = this.typeMap.get(name);
        if (!type) {
            return;
        }

        if (NON_NAVIGABLE_KINDS.has(type.kind)) {
            return;
        }

        const existingIndex = this.navigationStack.indexOf(name);
        if (existingIndex !== -1) {
            this.navigationStack = this.navigationStack.slice(0, existingIndex + 1);
        } else {
            this.navigationStack.push(name);
        }

        this.search = "";
    }

    public navigateBack(): void {
        if (this.navigationStack.length === 0) {
            return;
        }

        this.navigationStack.pop();
    }

    public navigateToRoot(): void {
        this.navigationStack = [];
    }

    public setSearchQuery(query: string): void {
        this.search = query;
    }

    private findDeepMatch(type: IIntrospectionType, lowerSearch: string): string | null {
        for (const field of type.fields) {
            if (field.name.toLowerCase().includes(lowerSearch)) {
                return `field: ${field.name}`;
            }

            for (const arg of field.args || []) {
                if (arg.name.toLowerCase().includes(lowerSearch)) {
                    return `arg: ${arg.name}`;
                }
            }
        }

        for (const field of type.inputFields) {
            if (field.name.toLowerCase().includes(lowerSearch)) {
                return `input: ${field.name}`;
            }
        }

        for (const value of type.enumValues) {
            if (value.name.toLowerCase().includes(lowerSearch)) {
                return `enum: ${value.name}`;
            }
        }

        return null;
    }

    private buildCurrentView():
        | DocsExplorerPresenter.RootView
        | DocsExplorerPresenter.TypeView
        | null {
        if (this.typeMap.size === 0) {
            return null;
        }

        if (this.navigationStack.length === 0) {
            return this.buildRootView();
        }

        const typeName = this.navigationStack[this.navigationStack.length - 1];
        const type = this.typeMap.get(typeName);
        if (!type) {
            return this.buildRootView();
        }

        return this.buildTypeView(type);
    }

    private buildRootView(): DocsExplorerPresenter.RootView {
        const sections: DocsExplorerPresenter.RootSection[] = [];

        for (const rootName of this.rootTypeNames) {
            const rootType = this.typeMap.get(rootName);
            if (!rootType) {
                continue;
            }

            sections.push({
                name: rootName,
                fields: this.mapFields(rootType.fields)
            });
        }

        const allTypes = Array.from(this.typeMap.values());
        const lowerSearch = this.search.toLowerCase();

        const filteredTypes: DocsExplorerPresenter.TypeSummary[] = [];

        for (const type of allTypes) {
            const summary: DocsExplorerPresenter.TypeSummary = {
                name: type.name,
                typeKind: type.kind as DocsExplorerPresenter.GraphQLTypeKind,
                description: type.description,
                isNavigable: !NON_NAVIGABLE_KINDS.has(type.kind),
                matchContext: null
            };

            if (this.search === "") {
                filteredTypes.push(summary);
                continue;
            }

            if (type.name.toLowerCase().includes(lowerSearch)) {
                filteredTypes.push(summary);
                continue;
            }

            const context = this.findDeepMatch(type, lowerSearch);
            if (context) {
                summary.matchContext = context;
                filteredTypes.push(summary);
            }
        }

        return {
            kind: "root",
            sections,
            filteredTypes
        };
    }

    private buildTypeView(type: IIntrospectionType): DocsExplorerPresenter.TypeView {
        return {
            kind: "type",
            name: type.name,
            description: type.description,
            typeKind: type.kind as DocsExplorerPresenter.GraphQLTypeKind,
            fields: this.mapFields(type.fields),
            inputFields: this.mapInputFields(type.inputFields),
            enumValues: this.mapEnumValues(type.enumValues),
            possibleTypes: type.possibleTypes.map(possibleType => this.buildTypeRef(possibleType)),
            interfaces: type.interfaces.map(iface => this.buildTypeRef(iface))
        };
    }

    private mapFields(fields: any[]): DocsExplorerPresenter.FieldVm[] {
        return fields.map(field => ({
            name: field.name,
            description: field.description || null,
            type: this.buildTypeRef(field.type),
            args: this.mapArgs(field.args || [])
        }));
    }

    private mapArgs(args: any[]): DocsExplorerPresenter.ArgVm[] {
        return args.map(arg => ({
            name: arg.name,
            description: arg.description || null,
            type: this.buildTypeRef(arg.type),
            defaultValue: arg.defaultValue || null
        }));
    }

    private mapInputFields(fields: any[]): DocsExplorerPresenter.InputFieldVm[] {
        return fields.map(field => ({
            name: field.name,
            description: field.description || null,
            type: this.buildTypeRef(field.type),
            defaultValue: field.defaultValue || null
        }));
    }

    private mapEnumValues(values: any[]): DocsExplorerPresenter.EnumValueVm[] {
        return values.map(value => ({
            name: value.name,
            description: value.description || null
        }));
    }

    private buildTypeRef(introspectionType: any): DocsExplorerPresenter.TypeRef {
        const { name, displayName } = this.unwrapType(introspectionType);
        const resolved = this.typeMap.get(name);
        const isNavigable = resolved ? !NON_NAVIGABLE_KINDS.has(resolved.kind) : false;

        return { name, displayName, isNavigable };
    }

    private unwrapType(type: any): IUnwrappedTypeRef {
        if (type.kind === "NON_NULL") {
            const inner = this.unwrapType(type.ofType);
            return {
                name: inner.name,
                displayName: `${inner.displayName}!`
            };
        }

        if (type.kind === "LIST") {
            const inner = this.unwrapType(type.ofType);
            return {
                name: inner.name,
                displayName: `[${inner.displayName}]`
            };
        }

        return {
            name: type.name,
            displayName: type.name
        };
    }
}

export const DefaultDocsExplorerPresenter = DocsExplorerPresenter.createImplementation({
    implementation: DocsExplorerPresenterImpl,
    dependencies: []
});
