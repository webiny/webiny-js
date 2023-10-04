import { makeAutoObservable } from "mobx";

import {
    Mode,
    QueryObject,
    QueryObjectDTO,
    QueryObjectMapper,
    QueryObjectRepository
} from "../../QueryObject";

interface IQuerySaverPresenter {
    getViewModel: () => QuerySaverViewModel;
    load: (queryObject: QueryObjectDTO | null) => void;
    persistQueryObject: (mode: Mode) => Promise<void>;
    setQueryObject: (queryObject: QueryObjectDTO) => void;
}

export interface QuerySaverViewModel {
    queryObject: QueryObjectDTO;
}

export class QuerySaverPresenter implements IQuerySaverPresenter {
    private readonly repository: QueryObjectRepository;
    private queryObject: QueryObjectDTO;

    constructor(repository: QueryObjectRepository) {
        this.repository = repository;
        this.queryObject = QueryObjectMapper.toDTO(
            QueryObject.createEmpty(this.repository.modelId)
        );

        makeAutoObservable(this);
    }

    load(queryObject: QueryObjectDTO | null) {
        if (queryObject) {
            this.queryObject = QueryObjectMapper.toDTO(QueryObject.create(queryObject));
        } else {
            this.queryObject = QueryObjectMapper.toDTO(
                QueryObject.createEmpty(this.repository.modelId)
            );
        }
    }

    setQueryObject(queryObject: QueryObjectDTO) {
        this.queryObject = queryObject;
    }

    persistQueryObject = async (mode: Mode) => {
        if (mode === Mode.UPDATE) {
            return await this.repository.updateFilter(this.queryObject);
        }

        return await this.repository.createFilter(this.queryObject);
    };

    getViewModel() {
        return {
            queryObject: this.queryObject
        };
    }
}
