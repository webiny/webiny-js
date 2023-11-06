import { Entity } from "dynamodb-toolbox";

interface Params {
    entity: Entity;
    item: {
        PK: string;
        SK: string;
        [key: string]: any;
    };
}

export const put = async (params: Params): Promise<void> => {
    const { entity, item } = params;

    await entity.put(item);
};
