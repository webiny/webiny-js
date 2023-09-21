import { makeAutoObservable } from "mobx";
import { FieldDTO, QueryObjectDTO } from "../domain";

export class QueryBuilderViewModel {
    public queryObject: QueryObjectDTO;
    public fields: FieldDTO[];
    public invalidFields: Record<string, { isValid: boolean; message: string }> = {};

    constructor(queryObject: QueryObjectDTO, fields: FieldDTO[]) {
        this.queryObject = queryObject;
        this.fields = fields;
        makeAutoObservable(this);
    }
}
