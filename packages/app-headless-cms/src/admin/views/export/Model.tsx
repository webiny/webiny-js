import React, { useCallback, useMemo } from "react";
import { CmsModel } from "@webiny/app-headless-cms-common/types";

interface Props {
    model: Pick<CmsModel, "modelId" | "name" | "plugin">;
    toggle: (model: string | Pick<CmsModel, "modelId">) => void;
    isSelected: (model: string | Pick<CmsModel, "modelId">) => boolean;
}

export const Model: React.VFC<Props> = ({ model, toggle, isSelected }) => {
    const onChange = useCallback(() => {
        toggle(model);
    }, [toggle]);

    const name = useMemo(() => {
        return [model.name, model.plugin ? `(code)` : null].filter(Boolean).join(" ");
    }, [model.modelId]);
    return (
        <div>
            <label>
                <input type="checkbox" onChange={onChange} checked={isSelected(model)} /> {name}
            </label>
        </div>
    );
};
