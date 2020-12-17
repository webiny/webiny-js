import React from "react";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { useRouter, match } from "@webiny/react-router";
import { ReactComponent as BackIcon } from "./icons/round-arrow_back-24px.svg";

const backStyles = css({
    marginLeft: -10
});

const BackButton = React.memo(() => {
    const router = useRouter();

    const matched: match<{
        id?: string;
    }> = router.match;

    const { id } = matched.params;

    return (
        <IconButton
            data-testid="cms-editor-back-button"
            className={backStyles}
            onClick={() => router.history.push(`/cms/content-models?id=${id}`)}
            icon={<BackIcon />}
        />
    );
});

BackButton.displayName = "BackButton";

export default BackButton;
