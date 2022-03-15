import React from "react";
import { useRouter } from "@webiny/react-router";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as BackIcon } from "./icons/round-arrow_back-24px.svg";
import { css } from "emotion";

const backStyles = css({
    marginLeft: -10
});

interface MatchInput {
    params?: {
        id?: string;
    };
}

const getIdFromMatch = (match: MatchInput | null): string => {
    if (!match || !match.params) {
        return "";
    }
    return match.params.id || "";
};

const BackButton: React.FC = () => {
    const { match, history } = useRouter();

    const id = getIdFromMatch(match as unknown as MatchInput);
    return (
        <IconButton
            data-testid="pb-editor-back-button"
            className={backStyles}
            onClick={() => history.push(`/page-builder/pages?id=${id}`)}
            icon={<BackIcon />}
        />
    );
};

export default BackButton;
