import { makeAutoObservable } from "mobx";

import {
    Batch,
    BatchDTO,
    FieldDTO,
    OperationDTO
} from "~/components/BulkActions/ActionEdit/domain";

export interface IBatchEditorDialogPresenter {
    load(batch: BatchDTO, fields: FieldDTO[]): void;
    addOperation(): void;
    deleteOperation(operationIndex: number): void;
    setOperationFieldData(operationIndex: number, data: string): void;
    setBatch(data: any): void;
    onApply(onSuccess?: (batch: BatchDTO) => void, onError?: (batch: BatchDTO) => void): void;
    get vm(): BatchEditorDialogViewModel;
}

export interface BatchEditorDialogViewModel {
    fields: FieldDTO[];
    invalidFields: Record<string, { isValid: boolean; message: string }>;
    data: BatchEditorFormData;
}

export interface BatchEditorFormData {
    operations: (OperationDTO & { canDelete: boolean })[];
}

export class BatchEditorDialogPresenter implements IBatchEditorDialogPresenter {
    private batch: BatchDTO | undefined;
    private fields: FieldDTO[];
    private invalidFields: BatchEditorDialogViewModel["invalidFields"] = {};
    private formWasSubmitted = false;

    constructor() {
        this.batch = undefined;
        this.fields = [];
        makeAutoObservable(this);
    }

    load(batch: BatchDTO, fields: FieldDTO[]) {
        this.batch = batch;
        this.fields = fields;
    }

    get vm() {
        return {
            fields: this.fields,
            invalidFields: this.invalidFields,
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

        if (this.formWasSubmitted) {
            this.validateBatch(this.batch);
        }
    }

    onApply(
        onSuccess?: (batch: BatchDTO) => void,
        onError?: (
            batch: BatchDTO,
            invalidFields: BatchEditorDialogViewModel["invalidFields"]
        ) => void
    ) {
        if (!this.batch) {
            return;
        }

        const result = this.validateBatch(this.batch);
        if (result.success) {
            onSuccess && onSuccess(this.batch);
        } else {
            onError && onError(this.batch, this.invalidFields);
        }
    }

    private validateBatch(data: BatchDTO) {
        this.formWasSubmitted = true;
        const validation = Batch.validate(data);

        if (!validation.success) {
            this.invalidFields = validation.error.issues.reduce((acc, issue) => {
                return {
                    ...acc,
                    [issue.path.join(".")]: issue.message
                };
            }, {});
        } else {
            this.invalidFields = {};
        }

        return validation;
    }
}
