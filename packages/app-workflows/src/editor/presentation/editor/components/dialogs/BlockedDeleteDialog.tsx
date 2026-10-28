import React from "react";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
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
            <ul
                data-testid="blocked-reviews"
                className="flex flex-col divide-y divide-neutral-muted rounded-md border border-neutral-muted"
            >
                {dialog.reviews.map(review => (
                    <li key={review.reviewId}>
                        <a
                            href={review.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-sm px-md py-sm"
                        >
                            <span className="flex flex-1 flex-col">
                                <Text as="span" size="md" className="font-semibold">
                                    {review.title}
                                </Text>
                                <Text as="span" size="sm" className="text-neutral-strong">
                                    {review.position}
                                </Text>
                            </span>
                            <Icon
                                icon={<OpenInNewIcon />}
                                label=""
                                size="sm"
                                color="neutral-light"
                                data-icon="open_in_new"
                            />
                        </a>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <EditorConfirmDialog {...props} testId="blocked-delete-dialog">
            {reviews}
        </EditorConfirmDialog>
    );
};
