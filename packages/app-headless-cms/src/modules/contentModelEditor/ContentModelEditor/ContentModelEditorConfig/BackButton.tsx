import React from "react";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { useRouter } from "@webiny/react-router";
import { ReactComponent as BackIcon } from "@material-design-icons/svg/round/arrow_back.svg";
import { createComponentPlugin } from "@webiny/react-composition";
import { Editor } from "~/modelEditor";

const backStyles = css({
    marginLeft: -10
});

export const BackButton = createComponentPlugin(Editor.Header.LeftSection, Original => {
    return function LeftSection({ children }) {
        const { history } = useRouter();

        return (
            <Original>
                <IconButton
                    data-testid="cms-editor-back-button"
                    className={backStyles}
                    onClick={() => history.push(`/cms/content-models`)}
                    icon={<BackIcon />}
                />
                {children}
            </Original>
        );
    };
});
