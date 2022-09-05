import React from "react";
import { css } from "emotion";
import { createComponentPlugin } from "@webiny/app-admin";
import { useRouter } from "@webiny/react-router";
import { IconButton } from "@webiny/ui/Button";
import { EditorBar } from "~/editor";
import { ReactComponent as BackIcon } from "./round-arrow_back-24px.svg";

const backStyles = css({
    marginLeft: -10
});

export const BackButtonPlugin = createComponentPlugin(EditorBar.BackButton, () => {
    return function BackButton() {
        const { params, history } = useRouter();

        const id = params ? params["id"] : null;
        return (
            <IconButton
                data-testid="pb-editor-back-button"
                className={backStyles}
                onClick={() => {
                    if (!id) {
                        console.error("Could not determine block ID from params.");
                        return;
                    }
                    history.push(`/page-builder/blocks?id=${id}`);
                }}
                icon={<BackIcon />}
            />
        );
    };
});
