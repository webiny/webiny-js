import { Entity } from "~/toolbox";

interface Params {
    entity: Entity;
    item: {
        PK: string;
        SK: string;
        [key: string]: any;
    };
}

export const put = async (params: Params) => {
    const { entity, item } = params;

    return await entity.put(item, {
        execute: true
    });
};
