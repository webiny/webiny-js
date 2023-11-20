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

export class ActionEditPresenter {
    private showEditor = false;
    private readonly currentBatch: BatchDTO;
    private extensionFields: FieldDTO[];

    constructor() {
        this.extensionFields = [];
        this.currentBatch = BatchMapper.toDTO(Batch.createEmpty());
        makeAutoObservable(this);
    }

    load(fields: FieldRaw[]) {
        this.extensionFields = this.getExtensionFields(fields);
    }

    private getExtensionFields(fields: FieldRaw[]) {
        const extensions = fields.find(field => field.fieldId === "extensions");

        if (!extensions?.settings?.fields) {
            return [];
        }

        const extensionFields =
            extensions.settings.fields.filter(
                field => field.tags && field.tags.includes("field:bulk-edit")
            ) || [];

        return FieldMapper.toDTO(extensionFields.map(field => Field.createFromRaw(field)));
    }

    private get editorVm() {
        return {
            isOpen: this.showEditor
        };
    }

    get vm() {
        return {
            show: this.extensionFields.length > 0,
            currentBatch: this.currentBatch,
            fields: this.extensionFields,
            editorVm: this.editorVm
        };
    }

    openEditor() {
        this.showEditor = true;
    }

    closeEditor() {
        this.showEditor = false;
    }
}
