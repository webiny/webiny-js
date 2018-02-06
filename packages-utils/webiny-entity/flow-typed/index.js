declare type OrderTuple = [string, number];

declare type EntityFindParams = {
    query?: Object,
    page?: number,
    perPage?: number,
    order?: Array<OrderTuple>,
    includeDeleted?: boolean
};

declare type EntityFindOneParams = {
    query?: Object,
    includeDeleted?: boolean
};

declare type EntitySaveParams = {
    validation?: boolean,
    events?: {
        save?: boolean,
        beforeSave?: boolean,
        beforeUpdate?: boolean,
        beforeCreate?: boolean,
        afterSave?: boolean,
        afterUpdate?: boolean,
        afterCreate?: boolean
    }
};

declare type EntityDeleteParams = {
    validation?: boolean,
    events?: {
        delete?: boolean,
        beforeDelete?: boolean,
        afterDelete?: boolean
    }
};
