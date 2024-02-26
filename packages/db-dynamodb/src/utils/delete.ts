import { Entity } from "~/toolbox";

interface Params {
    entity: Entity;
    keys: {
        PK: string;
        SK: string;
    };
}

export const deleteItem = async (params: Params) => {
    const { entity, keys } = params;

    return await entity.delete(keys, {
        execute: true
    });
};
