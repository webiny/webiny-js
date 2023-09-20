import { makeAutoObservable } from "mobx";
import { QueryObject, QueryObjectMapper, Field, FieldMapper, FieldRaw } from "../domain";
import { QueryBuilderViewModel } from "./QueryBuilderViewModel";

export class QueryBuilderPresenter {
    private viewModel: QueryBuilderViewModel;

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

    getGraphQl() {
        return QueryObjectMapper.toGraphQL(this.viewModel.queryObject);
    }
}
