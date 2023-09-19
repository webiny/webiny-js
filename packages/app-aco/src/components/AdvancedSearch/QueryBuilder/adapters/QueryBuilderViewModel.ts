import { makeAutoObservable } from "mobx";
import { FieldDTO, Operation, QueryObject, QueryObjectDTO } from "../domain";

export class QueryBuilderViewModel {
    public queryObject: QueryObjectDTO;
    public fields: FieldDTO[];
    public invalidFields: Record<string, { isValid: boolean; message: string }> = {};
    private formWasSubmitted = false;

    constructor(queryObject: QueryObjectDTO, fields: FieldDTO[]) {
        this.queryObject = queryObject;
        this.fields = fields;
        makeAutoObservable(this);
    }

    addNewFilterToGroup(groupIndex: number) {
        this.queryObject.groups[groupIndex].filters.push({ field: "", value: "", condition: "" });
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
    }

    addGroup() {
        this.queryObject.groups.push({
            operation: Operation.AND,
            filters: [{ field: "", value: "", condition: "" }]
        });
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
    }

    setQueryObject(queryObject: QueryObjectDTO) {
        this.queryObject = queryObject;
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

        return validation;
    }
}
