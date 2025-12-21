export enum EntityType {
    CMS = "headless-cms"
}

export interface IGetElasticsearchEntityTypeParams {
    SK: string;
    index: string;
}

export const getElasticsearchEntityType = (
    params: IGetElasticsearchEntityTypeParams
): EntityType => {
    if (params.index.includes("-headless-cms-")) {
        return EntityType.CMS;
    }

    throw new Error(`Unknown entity type for item "${JSON.stringify(params)}".`);
};
