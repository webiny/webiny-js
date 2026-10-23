import React from "react";
import { Text } from "@webiny/admin-ui";
import { EditorConfirmDialog } from "./EditorConfirmDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";

/*
 * The workflow has running reviews (R278, QBZ-19): the count text, the blocking reviews (each a
 * link to its content), the closing note and only Close.
 */
export const BlockedDeleteDialog = (props: EditorDialogProps) => {
    const { dialog } = props;

    let reviews: React.ReactNode = null;
    if (dialog.reviews.length > 0) {
        reviews = (
            <ul data-testid="blocked-reviews" className="flex flex-col gap-sm">
                {dialog.reviews.map(review => (
                    <li key={review.reviewId}>
                        <a
                            href={review.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col"
                        >
                            <Text as="span" size="md" className="font-semibold">
                                {review.title}
                            </Text>
                            <Text as="span" size="sm" className="text-neutral-strong">
                                {review.position}
                            </Text>
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
