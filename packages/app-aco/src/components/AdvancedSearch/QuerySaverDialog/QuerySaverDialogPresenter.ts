import { makeAutoObservable } from "mobx";

import { QueryObject, QueryObjectDTO } from "../QueryObject";

interface IQuerySaverDialogPresenter {
    load: (queryObject: QueryObjectDTO) => void;
    setQueryObject: (queryObject: QueryObjectDTO) => void;
    onSubmit: (
        onSuccess?: (queryObject: QueryObjectDTO) => void,
        onError?: (
            queryObject: QueryObjectDTO,
            invalidFields: QuerySaverDialogViewModel["invalidFields"]
        ) => void
    ) => Promise<void>;
}

export interface QuerySaverDialogViewModel {
    queryObject: QueryObjectDTO;
    invalidFields: Record<string, { isValid: boolean; message: string }>;
}

export class QuerySaverDialogPresenter implements IQuerySaverDialogPresenter {
    private queryObject: QuerySaverDialogViewModel["queryObject"];
    private invalidFields: QuerySaverDialogViewModel["invalidFields"] = {};
    private formWasSubmitted = false;

    constructor(queryObject: QueryObjectDTO) {
        this.queryObject = queryObject;
        makeAutoObservable(this);
    }

    load(queryObject: QueryObjectDTO) {
        this.queryObject = queryObject;
    }

    get vm() {
        return {
            queryObject: this.queryObject,
            invalidFields: this.invalidFields
        };
    }

    setQueryObject(queryObject: QueryObjectDTO) {
        this.queryObject = queryObject;

        if (this.formWasSubmitted) {
            this.validateQueryObject(queryObject);
        }
    }

    async onSubmit(
        onSuccess?: (queryObject: QueryObjectDTO) => void,
        onError?: (
            queryObject: QueryObjectDTO,
            invalidFields: QuerySaverDialogViewModel["invalidFields"]
        ) => void
    ) {
        this.formWasSubmitted = true;
        const result = this.validateQueryObject(this.queryObject);

        if (result.success) {
            onSuccess && onSuccess(this.queryObject);
        } else {
            onError && onError(this.queryObject, this.invalidFields);
        }
    }

    private validateQueryObject(data: QueryObjectDTO) {
        const validation = QueryObject.validate(data);

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
