import React from "react";
import type { FloatingLinkEditorPlugin } from "@webiny/lexical-editor";
import { IconButton, Text, Heading, Link, Grid } from "@webiny/admin-ui";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as RemoveLink } from "@webiny/icons/link_off.svg";

type LinkPreviewForm = NonNullable<
    React.ComponentProps<typeof FloatingLinkEditorPlugin>["LinkPreviewForm"]
>;
type LinkPreviewFormProps = React.ComponentProps<LinkPreviewForm>;

export const LinkPreviewForm = ({ linkData, onEdit, removeLink }: LinkPreviewFormProps) => {
    return (
        <div className={"relative p-md"}>
            <Grid gap={"small"}>
                <Grid.Column span={12}>
                    <Heading level={5}>Preview Link</Heading>
                </Grid.Column>
                <Grid.Column span={12}>
                    <div className={"relative"}>
                        <div
                            className={
                                "w-full py-xs-plus pl-sm border-sm text-md peer rounded-md border-neutral-subtle bg-neutral-disabled"
                            }
                        >
                            <Link to={linkData.url} target="_blank" rel="noopener noreferrer">
                                {linkData.url}
                            </Link>
                        </div>
                        <div className={"absolute right-0 top-0"}>
                            <IconButton onClick={onEdit} icon={<EditIcon />} variant={"ghost"} />
                            <IconButton
                                onClick={removeLink}
                                icon={<RemoveLink />}
                                variant={"ghost"}
                            />
                        </div>
                    </div>
                </Grid.Column>
                <Grid.Column span={12}>
                    {linkData.target === "_blank" ? (
                        <Text as={"div"}>
                            • Open link in a <strong>new</strong> tab
                        </Text>
                    ) : (
                        <Text as={"div"}>
                            • Open link in the <strong>same</strong> tab
                        </Text>
                    )}
                    {linkData.alt && (
                        <Text as={"div"}>
                            • Alt text: <strong>{linkData.alt}</strong>
                        </Text>
                    )}
                </Grid.Column>
            </Grid>
        </div>
    );
};
