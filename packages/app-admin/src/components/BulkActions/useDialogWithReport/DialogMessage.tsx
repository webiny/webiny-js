import React from "react";
import { ReactComponent as ErrorIcon } from "@material-design-icons/svg/round/error.svg";
import { ReactComponent as SuccessIcon } from "@material-design-icons/svg/round/check_circle.svg";
import { Icon } from "@webiny/ui/Icon";
import { List, ListItemText, ListItemTextPrimary, ListItemTextSecondary } from "@webiny/ui/List";
import { ShowResultsDialogParams } from "./index";

import { ListItem, ListItemGraphic, MessageContainer } from "./useDialogWithReport.styles";

type ResultDialogMessageProps = Pick<ShowResultsDialogParams, "results" | "message">;

export const ResultDialogMessage: React.FC<ResultDialogMessageProps> = ({ results, message }) => {
    return (
        <>
            {message && <MessageContainer>{message}</MessageContainer>}
            <List nonInteractive={true}>
                {results.map((result, index) => (
                    <ListItem key={`item-${index}`}>
                        <ListItemGraphic status={result.status}>
                            <Icon
                                icon={result.status === "success" ? <SuccessIcon /> : <ErrorIcon />}
                            />
                        </ListItemGraphic>
                        <ListItemText>
                            <ListItemTextPrimary>{result.title}</ListItemTextPrimary>
                            <ListItemTextSecondary>{result.message}</ListItemTextSecondary>
                        </ListItemText>
                    </ListItem>
                ))}
            </List>
        </>
    );
};
