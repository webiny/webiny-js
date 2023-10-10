import { makeAutoObservable, runInAction } from "mobx";
import {
    Field,
    FieldDTO,
    FieldMapper,
    FieldRaw,
    Operation,
    QueryObject,
    QueryObjectDTO
} from "../../../QueryObject";

export interface IQueryBuilderPresenter {
    addGroup: () => void;
    addNewFilterToGroup: (groupIndex: number) => void;
    deleteFilterFromGroup: (groupIndex: number, filterIndex: number) => void;
    deleteGroup: (groupIndex: number) => void;
    emptyFilterIntoGroup: (groupIndex: number, filterIndex: number) => void;
    onSubmit: (
        onSuccess?: (queryObject: QueryObjectDTO) => void,
        onError?: (queryObject: QueryObjectDTO) => void
    ) => void;
    setQueryObject: (queryObject: QueryObjectDTO) => void;
    updateViewModel: () => void;
}

export interface QueryBuilderViewModel {
    fields: FieldDTO[];
    invalidFields: Record<string, { isValid: boolean; message: string }>;
    queryObject: QueryObjectDTO;
}

export class QueryBuilderPresenter implements IQueryBuilderPresenter {
    private readonly fields: QueryBuilderViewModel["fields"];
    private formWasSubmitted = false;
    private invalidFields: QueryBuilderViewModel["invalidFields"] = {};
    private queryObject: QueryBuilderViewModel["queryObject"];
    private callback: ((viewModel: QueryBuilderViewModel) => void) | undefined = undefined;

    constructor(queryObject: QueryObjectDTO, fields: FieldRaw[]) {
        this.queryObject = queryObject;
        this.fields = FieldMapper.toDTO(fields.map(field => Field.createFromRaw(field)));
        makeAutoObservable(this);
    }

    load(callback: (viewModel: QueryBuilderViewModel) => void) {
        this.callback = callback;
        this.updateViewModel();
    }

    updateViewModel() {
        const viewModel = {
            queryObject: this.queryObject,
            fields: this.fields,
            invalidFields: this.invalidFields
        };

        this.callback && this.callback(viewModel);
    }

    addGroup() {
        this.queryObject.groups.push({
            operation: Operation.AND,
            filters: [{ field: "", value: "", condition: "" }]
        });
        this.updateViewModel();
    }

    deleteGroup(groupIndex: number) {
        this.queryObject.groups = this.queryObject.groups.filter(
            (_, index) => index !== groupIndex
        );

        // Make sure we always have at least 1 group!
        if (this.queryObject.groups.length === 0) {
            this.queryObject.groups.push({
                operation: Operation.AND,
                filters: [{ field: "", value: "", condition: "" }]
            });
        }
        this.updateViewModel();
    }

    addNewFilterToGroup(groupIndex: number) {
        this.queryObject.groups[groupIndex].filters.push({
            field: "",
            value: "",
            condition: ""
        });
        this.updateViewModel();
    }

    deleteFilterFromGroup(groupIndex: number, filterIndex: number) {
        const filters = this.queryObject.groups[groupIndex].filters;
        this.queryObject.groups[groupIndex].filters = filters.filter(
            (_, index) => index !== filterIndex
        );

        // Make sure we always have at least 1 filter!
        if (this.queryObject.groups[groupIndex].filters.length === 0) {
            this.queryObject.groups[groupIndex].filters.push({
                field: "",
                value: "",
                condition: ""
            });
        }
        this.updateViewModel();
    }

    emptyFilterIntoGroup(groupIndex: number, filterIndex: number) {
        this.queryObject.groups[groupIndex].filters = [
            ...this.queryObject.groups[groupIndex].filters.slice(0, filterIndex),
            {
                field: "",
                value: "",
                condition: ""
            },
            ...this.queryObject.groups[groupIndex].filters.slice(filterIndex + 1)
        ];
        this.updateViewModel();
    }

    setQueryObject(queryObject: QueryObjectDTO) {
        runInAction(() => {
            this.queryObject = queryObject;
            this.updateViewModel();

            if (this.formWasSubmitted) {
                this.validateQueryObject(queryObject);
            }
        });
    }

    onSubmit(
        onSuccess?: (queryObject: QueryObjectDTO) => void,
        onError?: (queryObject: QueryObjectDTO) => void
    ) {
        const result = this.validateQueryObject(this.queryObject);
        if (result.success) {
            onSuccess && onSuccess(this.queryObject);
        } else {
            onError && onError(this.queryObject);
        }
    }

    onSave(
        onSuccess?: (queryObject: QueryObjectDTO) => void,
        onError?: (queryObject: QueryObjectDTO) => void
    ) {
        const result = this.validateQueryObject(this.queryObject);
        if (result.success) {
            onSuccess && onSuccess(this.queryObject);
        } else {
            onError && onError(this.queryObject);
        }
    }

    private validateQueryObject(data: QueryObjectDTO) {
        this.formWasSubmitted = true;
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

        this.updateViewModel();

        return validation;
    }
}
