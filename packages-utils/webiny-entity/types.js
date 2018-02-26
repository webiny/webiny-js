export type OrderTuple = [string, number];

export type EntityFindParams = {
    query?: Object,
    page?: number,
    perPage?: number,
    order?: Array<OrderTuple>,
    includeDeleted?: boolean
};

export type EntityFindOneParams = {
    query?: Object,
    includeDeleted?: boolean
};

export type EntitySaveParams = {
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

export type EntityDeleteParams = {
    validation?: boolean,
    permanent?: boolean,
    events?: {
        delete?: boolean,
        beforeDelete?: boolean,
        afterDelete?: boolean
    }
};
