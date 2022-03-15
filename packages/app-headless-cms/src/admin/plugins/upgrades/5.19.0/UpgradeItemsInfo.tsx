import React from "react";
import { Typography } from "@webiny/ui/Typography";
import { UpgradeItems } from "./types";
import { CmsEditorContentModel } from "~/types";

interface UpgradingModelResponse {
    model: CmsEditorContentModel;
    total: number;
    current: number;
    locale: string;
}
const findUpgradingModel = (locales: UpgradeItems["locales"]): UpgradingModelResponse | null => {
    for (const locale in locales) {
        if (!locales[locale]) {
            continue;
        }
        const modelsData = Object.values(locales[locale]);
        for (const modelId in modelsData) {
            if (modelsData[modelId].upgrading !== true) {
                continue;
            }
            return {
                locale,
                model: modelsData[modelId].model,
                total: modelsData[modelId].entries.length,
                current: modelsData[modelId].entries.filter(item => item.done).length
            };
        }
    }
    return null;
};

interface UpgradeItemsInfoProps {
    upgradeItems: UpgradeItems | null;
}
export const UpgradeItemsInfo: React.FC<UpgradeItemsInfoProps> = props => {
    const { upgradeItems } = props;
    if (!upgradeItems || upgradeItems.loadedModels !== true || !upgradeItems.locales) {
        return null;
    }
    const { locales } = upgradeItems;

    const result = findUpgradingModel(locales);
    if (!result) {
        return <></>;
    }
    const { locale, model, current, total } = result;
    return (
        <Typography use={"body1"} tag={"div"}>
            Upgrading model <strong>{model.name}</strong> in locale <strong>{locale}</strong> (
            {current} of {total} updated)
        </Typography>
    );
};
