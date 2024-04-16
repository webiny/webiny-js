import React from "react";
import { observer } from "mobx-react-lite";
import { useDashboardPresenter } from "./DashboardPresenterProvider";
import { usePreviewUrl } from "./Components/usePreviewUrl";
import { DrawerRight, DrawerContent } from "@webiny/ui/Drawer";
import styled from "@emotion/styled";

const PreviewDrawer = styled(DrawerRight)`
    width: 50vw;
`;

export const ArticlePreview = observer(() => {
    const { presenter } = useDashboardPresenter();
    const getPreviewUrl = usePreviewUrl();

    const previewArticle = presenter.vm.previewArticle;
    const previewUrl = previewArticle ? getPreviewUrl(previewArticle) : undefined;

    return (
        <PreviewDrawer
            modal={true}
            onClose={() => presenter.hideArticlePreview()}
            open={Boolean(previewArticle)}
        >
            <DrawerContent>
                <iframe src={previewUrl} width="100%" height="100%" />
            </DrawerContent>
        </PreviewDrawer>
    );
});
