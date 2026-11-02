import React from "react";
import { Icon } from "@webiny/admin-ui";
import { List } from "@webiny/admin-ui";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import { EditorConfirmDialog } from "./EditorConfirmDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";

/*
 * The workflow has running reviews (R278, QBZ-19): the count and advice text, the blocking
 * reviews (each a link to its content) and only Close.
 */
export const BlockedDeleteDialog = (props: EditorDialogProps) => {
    const { dialog } = props;

    let reviews: React.ReactNode = null;
    if (dialog.reviews.length > 0) {
        reviews = (
            <List data-testid="blocked-reviews">
                {dialog.reviews.map(review => (
                    <a
                        key={review.reviewId}
                        href={review.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <List.Item
                            title={review.title}
                            description={review.position}
                            actions={
                                <Icon
                                    icon={<OpenInNewIcon />}
                                    label=""
                                    size="sm"
                                    data-icon="open_in_new"
                                />
                            }
                        />
                    </a>
                ))}
            </List>
        );
    }

    return (
        <EditorConfirmDialog {...props} testId="blocked-delete-dialog">
            {reviews}
        </EditorConfirmDialog>
    );
};
