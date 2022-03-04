import React from "react";
import { pageAtom, PageAtomType } from "../../../recoil/modules";
import { MenuItem } from "@webiny/ui/Menu";
import { useConfigureWebsiteUrlDialog } from "../../../../admin/hooks/useConfigureWebsiteUrl";
import { usePageBuilderSettings } from "../../../../admin/hooks/usePageBuilderSettings";
import { useSiteStatus } from "../../../../admin/hooks/useSiteStatus";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as PreviewIcon } from "../../../../admin/assets/visibility.svg";
import { useRecoilValue } from "recoil";

const openTarget = window.Cypress ? "_self" : "_blank";

const PreviewPageButton: React.FC = () => {
    const page = useRecoilValue(pageAtom) as Required<PageAtomType>;
    const { getPageUrl, getWebsiteUrl } = usePageBuilderSettings();
    const [isSiteRunning, refreshSiteStatus] = useSiteStatus(getWebsiteUrl());

    const { showConfigureWebsiteUrlDialog } = useConfigureWebsiteUrlDialog(
        getWebsiteUrl(),
        refreshSiteStatus
    );

    return (
        <MenuItem
            onClick={() => {
                if (isSiteRunning) {
                    window.open(getPageUrl(page, true), openTarget, "noopener");
                } else {
                    showConfigureWebsiteUrlDialog();
                }
            }}
            data-testid={"pb-editor-page-options-menu-preview"}
        >
            <ListItemGraphic>
                <Icon icon={<PreviewIcon />} />
            </ListItemGraphic>
            Preview
        </MenuItem>
    );
};

export default PreviewPageButton;
