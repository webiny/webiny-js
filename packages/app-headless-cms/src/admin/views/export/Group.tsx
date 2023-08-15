import React, { useCallback } from "react";
import { CmsGroup, CmsModel } from "@webiny/app-headless-cms-common/types";
import { Models } from "./Models";

interface Props {
    group: CmsGroup;
    isGroupSelected: (group: string | Pick<CmsGroup, "id">) => boolean;
    isModelSelected: (model: string | Pick<CmsModel, "modelId">) => boolean;
    toggleGroup: (group: string | Pick<CmsGroup, "id">) => void;
    toggleModel: (model: string | Pick<CmsModel, "modelId">) => void;
}

export const Group: React.VFC<Props> = ({
    isGroupSelected,
    isModelSelected,
    group,
    toggleGroup,
    toggleModel
}) => {
    const onChange = useCallback(() => {
        toggleGroup(group.id);
    }, [toggleGroup, group.id]);
    return (
        <div>
            <label>
                <input type="checkbox" onChange={onChange} checked={isGroupSelected(group)} />{" "}
                {group.name}
            </label>
            <Models
                group={group}
                isSelected={isModelSelected}
                toggle={toggleModel}
                models={group.contentModels}
            />
        </div>
    );
};
