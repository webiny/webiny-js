import { makeAutoObservable } from "mobx";

import {
    Batch,
    BatchDTO,
    BatchMapper,
    Field,
    FieldDTO,
    FieldMapper,
    FieldRaw
} from "~/components/BulkActions/ActionEdit/domain";

function isBulkEditableField(field: FieldRaw) {
    return field.tags && field.tags.includes("$bulk-edit");
}

interface IActionEditPresenter {
    load: (fields: FieldRaw[]) => void;
    openEditor: () => void;
    closeEditor: () => void;
    get vm(): {
        show: boolean;
        currentBatch: BatchDTO;
        fields: FieldDTO[];
        editorVm: {
            isOpen: boolean;
        };
    };
}

export class ActionEditPresenter implements IActionEditPresenter {
    private showEditor = false;
    private readonly currentBatch: BatchDTO;
    private fields: FieldDTO[];

    constructor() {
        this.fields = [];
        this.currentBatch = BatchMapper.toDTO(Batch.createEmpty());
        makeAutoObservable(this);
    }

    load(fields: FieldRaw[]) {
        this.fields = [...this.getBuiltInFields(fields), ...this.getExtensionFields(fields)];
    }

    get vm() {
        return {
            show: this.fields.length > 0,
            currentBatch: this.currentBatch,
            fields: this.fields,
            editorVm: this.editorVm
        };
    }

    openEditor() {
        this.showEditor = true;
    }

    closeEditor() {
        this.showEditor = false;
    }

    private getBuiltInFields(fields: FieldRaw[]) {
        const builtInFields = fields
            .filter(field => field.fieldId !== "extensions")
            .filter(isBulkEditableField);

        return FieldMapper.toDTO(builtInFields.map(field => Field.createFromRaw(field)));
    }

    private getExtensionFields(fields: FieldRaw[]) {
        const extensions = fields.find(field => field.fieldId === "extensions");

        if (!extensions?.settings?.fields) {
            return [];
        }

        const extensionFields = extensions.settings.fields.filter(isBulkEditableField) || [];

        const extFields = FieldMapper.toDTO(
            extensionFields.map(field => Field.createFromRaw(field))
        );

        return extFields.map(field => {
            return { ...field, value: `extensions.${field.value}` };
        });
    }

    private get editorVm() {
        return {
            isOpen: this.showEditor
        };
    }
}
