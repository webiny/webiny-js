import React, { useCallback } from "react";
import { useRouter } from "@webiny/react-router";
import { usePage } from "~/admin/views/Pages/PageDetails";
import { DuplicatePageMenuItem } from "./DuplicatePageMenuItem";
import { useDuplicatePage } from "~/admin/views/Pages/hooks/useDuplicatePage";

interface DefaultDuplicatePageProps {
    label: React.ReactNode;
    icon: React.ReactElement;
}

export const DefaultDuplicatePage = (props: DefaultDuplicatePageProps) => {
    const { page } = usePage();
    const { duplicatePage } = useDuplicatePage();
    const { history } = useRouter();

    const onClick = useCallback(async () => {
        await duplicatePage({
            page,
            onSuccess: page => {
                history.push(`/page-builder/pages?id=${encodeURIComponent(page.id)}`);
            }
        });
    }, [page]);

    return <DuplicatePageMenuItem icon={props.icon} onClick={onClick} label={props.label} />;
};
