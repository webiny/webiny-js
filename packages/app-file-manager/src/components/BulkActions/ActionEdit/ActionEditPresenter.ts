import { makeAutoObservable } from "mobx";

import { Batch, BatchDTO, BatchMapper } from "~/components/BulkActions/ActionEdit/domain";

export class ActionEditPresenter {
    private showEditor = false;
    private currentBatch: BatchDTO;

    constructor() {
        this.currentBatch = BatchMapper.toDTO(Batch.createEmpty());
        makeAutoObservable(this);
    }

    private get editorVm() {
        return {
            isOpen: this.showEditor
        };
    }

    get vm() {
        return {
            currentBatch: this.currentBatch,
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
