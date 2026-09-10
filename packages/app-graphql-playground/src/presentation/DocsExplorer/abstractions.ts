import { createAbstraction } from "@webiny/feature/admin";

export type IDocsGraphQLTypeKind =
    | "OBJECT"
    | "INPUT_OBJECT"
    | "ENUM"
    | "UNION"
    | "INTERFACE"
    | "SCALAR";

export type IDocsSchemaStatus = "idle" | "loading" | "ready";

export interface IDocsTypeRef {
    name: string;
    displayName: string;
    isNavigable: boolean;
}

export interface IDocsArgVm {
    name: string;
    description: string | null;
    type: IDocsTypeRef;
    defaultValue: string | null;
}

export interface IDocsFieldVm {
    name: string;
    description: string | null;
    type: IDocsTypeRef;
    args: IDocsArgVm[];
}

export interface IDocsInputFieldVm {
    name: string;
    description: string | null;
    type: IDocsTypeRef;
    defaultValue: string | null;
}

export interface IDocsEnumValueVm {
    name: string;
    description: string | null;
}

export interface IDocsTypeSummary {
    name: string;
    typeKind: IDocsGraphQLTypeKind;
    description: string | null;
    isNavigable: boolean;
    matchContext: string | null;
}

export interface IDocsRootSection {
    name: string;
    fields: IDocsFieldVm[];
}

export interface IDocsRootView {
    kind: "root";
    sections: IDocsRootSection[];
    filteredTypes: IDocsTypeSummary[];
}

export interface IDocsTypeView {
    kind: "type";
    name: string;
    description: string | null;
    typeKind: IDocsGraphQLTypeKind;
    fields: IDocsFieldVm[];
    inputFields: IDocsInputFieldVm[];
    enumValues: IDocsEnumValueVm[];
    possibleTypes: IDocsTypeRef[];
    interfaces: IDocsTypeRef[];
}

export interface IDocsExplorerVm {
    open: boolean;
    schemaStatus: IDocsSchemaStatus;
    searchQuery: string;
    breadcrumbs: string[];
    currentView: IDocsRootView | IDocsTypeView | null;
}

export interface IDocsExplorerPresenter {
    readonly vm: IDocsExplorerVm;
    toggle(): void;
    setSchema(schema: Record<string, any> | null, status: IDocsSchemaStatus): void;
    navigateToType(name: string): void;
    navigateBack(): void;
    navigateToRoot(): void;
    setSearchQuery(query: string): void;
}

export const DocsExplorerPresenter =
    createAbstraction<IDocsExplorerPresenter>("DocsExplorerPresenter");

export namespace DocsExplorerPresenter {
    export type Interface = IDocsExplorerPresenter;
    export type Vm = IDocsExplorerVm;
    export type RootView = IDocsRootView;
    export type TypeView = IDocsTypeView;
    export type RootSection = IDocsRootSection;
    export type TypeSummary = IDocsTypeSummary;
    export type TypeRef = IDocsTypeRef;
    export type FieldVm = IDocsFieldVm;
    export type InputFieldVm = IDocsInputFieldVm;
    export type ArgVm = IDocsArgVm;
    export type EnumValueVm = IDocsEnumValueVm;
    export type GraphQLTypeKind = IDocsGraphQLTypeKind;
    export type SchemaStatus = IDocsSchemaStatus;
}
