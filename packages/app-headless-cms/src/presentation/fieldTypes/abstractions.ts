import React from "react";
import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel, CmsModelField, CmsLayoutField, DragSource } from "~/types.js";

export interface CmsModelFieldValidatorConfig {
    name: string;
    required?: boolean;
    label?: string;
    description?: string;
    defaultMessage?: string;
    defaultSettings?: Record<string, any>;
    variables?: { name: string; description: string }[];
}

export interface CmsModelFieldValidatorsGroup {
    validators: (string | CmsModelFieldValidatorConfig)[];
    title?: string;
    description?: string;
}

export interface CmsModelFieldValidatorsFactory {
    (field: CmsModelField): string[] | CmsModelFieldValidatorsGroup;
}

export interface ICmsFieldType {
    readonly type: string;
    readonly label: string;
    readonly description: string;
    readonly icon: React.ReactElement;

    readonly allowList: boolean;
    readonly listLabel?: string;
    readonly allowPredefinedValues: boolean;

    readonly validators?: string[] | CmsModelFieldValidatorsGroup | CmsModelFieldValidatorsFactory;
    readonly listValidators?:
        | string[]
        | CmsModelFieldValidatorsGroup
        | CmsModelFieldValidatorsFactory;

    readonly hideInAdmin?: boolean;
    readonly tags?: string[];
    readonly canEditSettings?: boolean;
    readonly allowLayout?: boolean;

    canAccept?(field: CmsModelField, draggable: DragSource): boolean;

    renderInfo?(params: { field: CmsModelField; model: CmsModel }): React.ReactNode;
    renderEditor?(params: { field: CmsModelField; model: CmsModel }): React.ReactNode;

    createField(): Pick<CmsModelField, "type" | "validation" | "renderer" | "settings">;
}

export const CmsFieldType = createAbstraction<ICmsFieldType>("CmsFieldType");

export namespace CmsFieldType {
    export type Interface = ICmsFieldType;
}

export interface ICmsLayoutFieldType {
    readonly type: string;
    readonly label: string;
    readonly description: string;
    readonly icon: React.ReactElement;
    readonly canEditSettings?: boolean;

    createField(): Omit<CmsLayoutField, "id">;

    collectFields?(params: {
        field: CmsLayoutField;
        getField: (id: string) => CmsModelField | undefined;
    }): CmsModelField[];

    getFieldLabelPrefixes?(params: { field: CmsLayoutField }): Record<string, string>;

    render(params: {
        field: CmsLayoutField;
        onUpdate: (d: CmsLayoutField) => void;
        onDelete: () => void;
    }): React.ReactElement;
}

export const CmsLayoutFieldType = createAbstraction<ICmsLayoutFieldType>("CmsLayoutFieldType");

export namespace CmsLayoutFieldType {
    export type Interface = ICmsLayoutFieldType;
}
