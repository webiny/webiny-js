import { Entity } from "~/toolbox";

interface Params {
    entity: Entity;
    item: {
        PK: string;
        SK: string;
        [key: string]: any;
    };
}

export const update = async (params: Params) => {
    const { entity, item } = params;

    return await entity.update(item, {
        execute: true
    });
};
