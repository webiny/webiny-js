import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as BackIcon } from "./icons/round-arrow_back-24px.svg";
import { css } from "emotion";
import { useRouter } from "@webiny/react-router";

const backStyles = css({
    marginLeft: -10
});

const BackButton = React.memo(() => {
    const router = useRouter();

    const matched = router.match;

    const { id = undefined } = matched ? matched.params : {};

    return (
        <IconButton
            data-testid="fb-editor-back-button"
            className={backStyles}
            onClick={() => router.history.push(`/form-builder/forms?id=${id}`)}
            icon={<BackIcon />}
        />
    );
});

BackButton.displayName = "BackButton";

export default BackButton;
