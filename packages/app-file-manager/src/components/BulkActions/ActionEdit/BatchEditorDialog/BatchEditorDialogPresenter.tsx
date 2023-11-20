import { makeAutoObservable } from "mobx";

import {
    BatchDTO,
    Field,
    FieldDTO,
    FieldMapper,
    FieldRaw,
    OperationDTO
} from "~/components/BulkActions/ActionEdit/domain";

export interface IBatchEditorDialogPresenter {
    load(batch: BatchDTO): void;
    addOperation(): void;
    deleteOperation(operationIndex: number): void;
    setOperationFieldData(operationIndex: number, data: string): void;
    setBatch(data: any): void;
    onApply(onSuccess?: (batch: BatchDTO) => void, onError?: (batch: BatchDTO) => void): void;
}

export interface BatchEditorDialogViewModel {
    fields: FieldDTO[];
    data: BatchEditorFormData;
}

export interface BatchEditorFormData {
    operations: (OperationDTO & { canDelete: boolean })[];
}

export class BatchEditorDialogPresenter implements IBatchEditorDialogPresenter {
    private batch: BatchDTO | undefined;
    private readonly fields: FieldDTO[];

    constructor(fields: FieldRaw[]) {
        this.batch = undefined;
        this.fields = FieldMapper.toDTO(fields.map(field => Field.createFromRaw(field)));
        makeAutoObservable(this);
    }

    load(batch: BatchDTO) {
        this.batch = batch;
    }

    get vm() {
        return {
            fields: this.fields,
            data: {
                operations:
                    this.batch?.operations.map((operation: OperationDTO, operationIndex) => {
                        return {
                            field: operation.field,
                            operator: operation.operator,
                            value: operation.value,
                            canDelete: operationIndex !== 0
                        };
                    }) || []
            }
        };
    }

    addOperation(): void {
        if (!this.batch) {
            return;
        }

        this.batch.operations.push({
            field: "",
            operator: "",
            value: {}
        });
    }

    deleteOperation(operationIndex: number): void {
        if (!this.batch) {
            return;
        }

        this.batch.operations = this.batch.operations.filter(
            (_, index) => index !== operationIndex
        );
    }

    setOperationFieldData(batchIndex: number, data: string) {
        if (!this.batch) {
            return;
        }

        this.batch.operations = [
            ...this.batch.operations.slice(0, batchIndex),
            {
                field: data,
                operator: "",
                value: {}
            },
            ...this.batch.operations.slice(batchIndex + 1)
        ];
    }

    setBatch(data: BatchEditorFormData): void {
        if (!this.batch) {
            return;
        }

        this.batch = {
            ...this.batch,
            operations: data.operations.map(operation => ({
                field: operation.field,
                operator: operation.operator,
                value: operation.value
            }))
        };
    }

    onApply(onSuccess?: (batch: BatchDTO) => void, onError?: (batch: BatchDTO) => void) {
        if (!this.batch) {
            return;
        }

        onSuccess && onSuccess(this.batch);
    }
}
