import { makeAutoObservable } from "mobx";

import { Filter, FilterDTO } from "../domain";

export interface QuerySaverDialogPresenterInterface {
    load(filter: FilterDTO): void;
    setFilter(data: QuerySaverDialogFormData): void;
    onSave(
        onSuccess?: (filter: FilterDTO) => void,
        onError?: (
            filter: FilterDTO,
            invalidFields: QuerySaverDialogViewModel["invalidFields"]
        ) => void
    ): Promise<void>;
    get vm(): {
        invalidFields: QuerySaverDialogViewModel["invalidFields"];
        data: QuerySaverDialogFormData;
    };
}

export interface QuerySaverDialogFormData {
    name: string;
    description?: string;
}

export interface QuerySaverDialogViewModel {
    filter: FilterDTO | undefined;
    invalidFields: Record<string, { isValid: boolean; message: string }>;
}

export class QuerySaverDialogPresenter implements QuerySaverDialogPresenterInterface {
    private filter: QuerySaverDialogViewModel["filter"];
    private invalidFields: QuerySaverDialogViewModel["invalidFields"] = {};
    private formWasSubmitted = false;

    constructor() {
        this.filter = undefined;
        makeAutoObservable(this);
    }

    load(filter: FilterDTO) {
        this.filter = filter;
    }

    get vm() {
        return {
            invalidFields: this.invalidFields,
            data: {
                name: this.filter?.name || "",
                description: this.filter?.description || ""
            }
        };
    }

    setFilter(data: QuerySaverDialogFormData) {
        if (!this.filter) {
            return;
        }

        this.filter = {
            ...this.filter,
            ...data
        };

        if (this.formWasSubmitted) {
            this.validateFilter(this.filter);
        }
    }

    async onSave(
        onSuccess?: (filter: FilterDTO) => void,
        onError?: (
            filter: FilterDTO,
            invalidFields: QuerySaverDialogViewModel["invalidFields"]
        ) => void
    ) {
        if (!this.filter) {
            return;
        }

        const result = this.validateFilter(this.filter);
        if (result.success) {
            onSuccess && onSuccess(this.filter);
        } else {
            onError && onError(this.filter, this.invalidFields);
        }
    }

    private validateFilter(data: FilterDTO) {
        this.formWasSubmitted = true;
        const validation = Filter.validate(data);

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
