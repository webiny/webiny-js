import React, { useState, useEffect, useCallback } from "react";
import { Button, DropdownMenu } from "@webiny/admin-ui";
import { ReactComponent as ArrowDown } from "@webiny/icons/keyboard_arrow_down.svg";
import { ReactComponent as Draft } from "@webiny/icons/draw.svg";
import { ReactComponent as Unpublished } from "@webiny/icons/lock.svg";
import { ReactComponent as Published } from "@webiny/icons/remove_red_eye.svg";
import { useGetPageRevisions } from "~/features/pages";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument";
import { PageRevision } from "~/domain/PageRevision";
import { PAGE_EDITOR_ROUTE } from "~/constants";
import type { EditorPage } from "@webiny/website-builder-sdk";

const { Item } = DropdownMenu;

const statusIcon: Record<string, JSX.Element> = {
    draft: <Draft />,
    published: <Published />,
    unpublished: <Unpublished />
};

export const RevisionsMenu = () => {
    const [revisions, setRevisions] = useState<PageRevision[]>([]);
    const { loading, getPageRevisions } = useGetPageRevisions();
    const id = useSelectFromDocument(document => document.id);
    const status = useSelectFromDocument<string, EditorPage>(document => document.status);

    useEffect(() => {
        const [entryId] = id.split("#");
        getPageRevisions({ entryId }).then(revisions => {
            setRevisions(
                revisions
                    .sort((a, b) => {
                        return new Date(a.savedOn).getTime() - new Date(b.savedOn).getTime();
                    })
                    .reverse()
            );
        });
    }, [id, status]);

    const currentRevision = revisions.find(r => r.id === id);

    const goToRevision = useCallback((id: string) => {
        // TODO: make this work without a full app reload
        window.location.pathname = `${PAGE_EDITOR_ROUTE}/${encodeURIComponent(id)}`;
    }, []);

    return (
        <DropdownMenu
            trigger={
                <Button
                    disabled={loading}
                    variant="ghost"
                    text={currentRevision ? currentRevision.getLabel() : "Loading..."}
                    icon={<ArrowDown />}
                    iconPosition={"end"}
                />
            }
        >
            {revisions.map(revision => (
                <Item
                    key={revision.id}
                    className={"wby-cursor-pointer"}
                    onClick={() => goToRevision(revision.id)}
                    disabled={revision.locked}
                    icon={
                        <Item.Icon
                            label={revision.getLabel()}
                            element={statusIcon[revision.status]}
                        />
                    }
                    text={revision.getLabel()}
                />
            ))}
        </DropdownMenu>
    );
};
