import { makeAutoObservable } from "mobx";
import {
    QueryObject,
    QueryObjectMapper,
    Field,
    FieldMapper,
    FieldRaw,
    Operation,
    QueryObjectDTO
} from "../domain";
import { QueryBuilderViewModel } from "./QueryBuilderViewModel";

interface IQueryBuilderPresenter {
    getViewModel: () => QueryBuilderViewModel;
    addGroup: () => void;
    deleteGroup: (groupIndex: number) => void;
    addNewFilterToGroup: (groupIndex: number) => void;
    deleteFilterFromGroup: (groupIndex: number, filterIndex: number) => void;
    emptyFilterIntoGroup: (groupIndex: number, filterIndex: number) => void;
    setQueryObject: (queryObject: QueryObjectDTO) => void;
    onSubmit: (queryObject: QueryObjectDTO, onSuccess?: () => void, onError?: () => void) => void;
}

export class QueryBuilderPresenter implements IQueryBuilderPresenter {
    private readonly viewModel: QueryBuilderViewModel;
    private formWasSubmitted = false;

    constructor(fields: FieldRaw[]) {
        makeAutoObservable(this);
        this.viewModel = new QueryBuilderViewModel(
            QueryObjectMapper.toDTO(QueryObject.createEmpty()),
            FieldMapper.toDTO(fields.map(field => Field.createFromRaw(field)))
        );
    }

    getViewModel() {
        return this.viewModel;
    }

    addGroup() {
        this.viewModel.queryObject.groups.push({
            operation: Operation.AND,
            filters: [{ field: "", value: "", condition: "" }]
        });
    }

    deleteGroup(groupIndex: number) {
        this.viewModel.queryObject.groups = this.viewModel.queryObject.groups.filter(
            (_, index) => index !== groupIndex
        );

        // Make sure we always have at least 1 group!
        if (this.viewModel.queryObject.groups.length === 0) {
            this.viewModel.queryObject.groups.push({
                operation: Operation.AND,
                filters: [{ field: "", value: "", condition: "" }]
            });
        }
    }

    addNewFilterToGroup(groupIndex: number) {
        this.viewModel.queryObject.groups[groupIndex].filters.push({
            field: "",
            value: "",
            condition: ""
        });
    }

    deleteFilterFromGroup(groupIndex: number, filterIndex: number) {
        const filters = this.viewModel.queryObject.groups[groupIndex].filters;
        this.viewModel.queryObject.groups[groupIndex].filters = filters.filter(
            (_, index) => index !== filterIndex
        );

        // Make sure we always have at least 1 filter!
        if (this.viewModel.queryObject.groups[groupIndex].filters.length === 0) {
            this.viewModel.queryObject.groups[groupIndex].filters.push({
                field: "",
                value: "",
                condition: ""
            });
        }
    }

    emptyFilterIntoGroup(groupIndex: number, filterIndex: number) {
        this.viewModel.queryObject.groups[groupIndex].filters = [
            ...this.viewModel.queryObject.groups[groupIndex].filters.slice(0, filterIndex),
            {
                field: "",
                value: "",
                condition: ""
            },
            ...this.viewModel.queryObject.groups[groupIndex].filters.slice(filterIndex + 1)
        ];
    }

    setQueryObject(queryObject: QueryObjectDTO) {
        this.viewModel.queryObject = queryObject;
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
            this.viewModel.invalidFields = validation.error.issues.reduce((acc, issue) => {
                return {
                    ...acc,
                    [issue.path.join(".")]: issue.message
                };
            }, {});
        } else {
            this.viewModel.invalidFields = {};
        }

        return validation;
    }
}
