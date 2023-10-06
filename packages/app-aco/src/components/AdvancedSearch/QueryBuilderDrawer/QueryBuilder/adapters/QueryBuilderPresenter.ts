import { makeAutoObservable } from "mobx";
import {
    Field,
    FieldDTO,
    FieldMapper,
    FieldRaw,
    Operation,
    QueryObject,
    QueryObjectDTO,
    QueryObjectMapper
} from "../../../QueryObject";

export interface IQueryBuilderPresenter {
    addGroup: () => void;
    addNewFilterToGroup: (groupIndex: number) => void;
    deleteFilterFromGroup: (groupIndex: number, filterIndex: number) => void;
    deleteGroup: (groupIndex: number) => void;
    emptyFilterIntoGroup: (groupIndex: number, filterIndex: number) => void;
    load: (callback: (viewModel: QueryBuilderViewModel) => void) => void;
    onSubmit: (queryObject: QueryObjectDTO, onSuccess?: () => void, onError?: () => void) => void;
    setQueryObject: (queryObject: QueryObjectDTO) => void;
    updateQueryObject: (queryObject: QueryObjectDTO | null) => void;
    updateViewModel: () => void;
}

export interface QueryBuilderViewModel {
    fields: FieldDTO[];
    invalidFields: Record<string, { isValid: boolean; message: string }>;
    queryObject: QueryObjectDTO;
}

export class QueryBuilderPresenter implements IQueryBuilderPresenter {
    private readonly modelId: string;
    private readonly fields: QueryBuilderViewModel["fields"];
    private formWasSubmitted = false;
    private invalidFields: QueryBuilderViewModel["invalidFields"] = {};
    private queryObject: QueryBuilderViewModel["queryObject"];
    private callback: ((viewModel: QueryBuilderViewModel) => void) | undefined = undefined;
    viewModel: QueryBuilderViewModel;

    constructor(modelId: string, fields: FieldRaw[]) {
        this.modelId = modelId;
        this.fields = FieldMapper.toDTO(fields.map(field => Field.createFromRaw(field)));
        this.queryObject = QueryObjectMapper.toDTO(QueryObject.createEmpty(this.modelId));
        this.viewModel = {
            queryObject: this.queryObject,
            fields: this.fields,
            invalidFields: this.invalidFields
        };
        makeAutoObservable(this);
    }

    load(callback: (viewModel: QueryBuilderViewModel) => void) {
        this.callback = callback;
        this.updateViewModel();
    }

    updateViewModel() {
        this.viewModel = {
            queryObject: this.queryObject,
            fields: this.fields,
            invalidFields: this.invalidFields
        };
        this.callback && this.callback(this.viewModel);
    }

    updateQueryObject(queryObject: QueryObjectDTO | null) {
        if (queryObject) {
            this.queryObject = QueryObjectMapper.toDTO(QueryObject.create(queryObject));
        } else {
            this.queryObject = QueryObjectMapper.toDTO(QueryObject.createEmpty(this.modelId));
        }
        this.updateViewModel();
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
        this.queryObject = queryObject;
        this.updateViewModel();

        if (this.formWasSubmitted) {
            this.validateQueryObject(queryObject);
        }
    }

    onSubmit(queryObject: QueryObjectDTO, onSuccess?: () => void, onError?: () => void) {
        this.formWasSubmitted = true;
        const result = this.validateQueryObject(queryObject);
        if (result.success) {
            onSuccess && onSuccess();
        } else {
            onError && onError();
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

        this.updateViewModel();

        return validation;
    }
}
