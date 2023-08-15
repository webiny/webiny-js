import { CmsGroup, CmsModel } from "@webiny/app-headless-cms-common/types";

interface Params {
    groups: CmsGroup[];
    models: CmsModel[];
}

export const download = (params: Params): void => {
    let element: HTMLAnchorElement | null = document.createElement("a");
    const data = new Blob([JSON.stringify(params)], {
        type: "application/json;charset=utf-8"
    });
    element.download = "webiny-groups-and-models.json";
    element.href = URL.createObjectURL(data);
    element.click();
    element.remove();
    element = null;
};
