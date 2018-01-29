declare type EntityFindParams = {
    query?: Object,
    page?: number,
    perPage?: number,
    order?: Array<OrderTuple>
};

declare type EntityCountParams = {
    query?: Object
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
