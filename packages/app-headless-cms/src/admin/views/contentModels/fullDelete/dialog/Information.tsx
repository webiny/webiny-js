import React from "react";
import { Text } from "@webiny/admin-ui";
import type { CmsModel } from "~/types.js";

export interface IInformationProps {
    model: Pick<CmsModel, "plugin">;
}

export const Information = (props: IInformationProps) => {
    const { model } = props;
    return (
        <ul className={"list-disc ml-md"}>
            {model.plugin ? (
                <>
                    <li>
                        This model is a plugin one, and it cannot be deleted. Only its entries can
                        be deleted.
                    </li>
                    <li>This action will permanently delete all model entries.</li>
                </>
            ) : (
                <li>This action will permanently delete the model and all its entries.</li>
            )}
            <li>References to this model in other parts of the system will be emptied.</li>
            <li>All relevant lifecycle events will be triggered.</li>
            <li>
                <Text className={`text-destructive-primary`}>
                    This action cannot be undone!
                </Text>
            </li>
        </ul>
    );
};
