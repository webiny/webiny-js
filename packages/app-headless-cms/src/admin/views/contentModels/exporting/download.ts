import { CmsGroup, CmsModel } from "@webiny/app-headless-cms-common/types";

interface Params {
    groups: CmsGroup[];
    models: CmsModel[];
}

const getName = (models: CmsModel[]): string => {
    if (models.length > 1) {
        return "groups-and-models";
    }
    const [model] = models;
    return model.modelId.toLowerCase();
};

export const download = (params: Params): void => {
    const { models } = params;
    let element: HTMLAnchorElement | null = document.createElement("a");
    const data = new Blob([JSON.stringify(params)], {
        type: "application/json;charset=utf-8"
    });
    const name = getName(models);
    element.download = `webiny-${name}.json`;
    element.href = URL.createObjectURL(data);
    element.click();
    element.remove();
    element = null;
};
