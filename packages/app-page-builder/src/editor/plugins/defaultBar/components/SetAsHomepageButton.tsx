import React from "react";
import gql from "graphql-tag";
import { pageAtom, PageAtomType } from "../../../recoil/modules";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useRouter } from "@webiny/react-router";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as HomeIcon } from "../../../../admin/assets/round-home-24px.svg";
import { useMutation } from "@apollo/react-hooks";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { useRecoilValue } from "recoil";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";

const PUBLISH_PAGE = gql`
    mutation PbPublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data {
                    id
                    path
                    status
                    locked
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const SetAsHomepageButton: React.FC = () => {
    const page = useRecoilValue(pageAtom) as Required<PageAtomType>;
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const publishPageMutation = useMutation(PUBLISH_PAGE);

    const { settings, updateSettingsMutation, isSpecialPage } = usePageBuilderSettings();

    return (
        <ConfirmationDialog
            message={
                <span>
                    You&#39;re about to set this page as your new homepage, are you sure you want to
                    continue? Note that the page will automatically be published.
                </span>
            }
        >
            {({ showConfirmation }) => (
                <MenuItem
                    disabled={isSpecialPage(page, "home")}
                    onClick={() => {
                        showConfirmation(async () => {
                            const [publish] = publishPageMutation;
                            await publish({
                                variables: { id: page.id }
                            });

                            const [updateSettings] = updateSettingsMutation;
                            const response = await updateSettings({
                                variables: {
                                    data: {
                                        pages: {
                                            ...settings.pages,
                                            home: page.id
                                        }
                                    }
                                }
                            });

                            const { error } = response.data.pageBuilder.updateSettings;
                            if (error) {
                                return showSnackbar(error.message);
                            }

                            history.push(`/page-builder/pages?id=${page.id}`);

                            // Let's wait a bit, because we are also redirecting the user.
                            setTimeout(() => showSnackbar("New homepage set successfully!"), 500);
                        });
                    }}
                >
                    <ListItemGraphic>
                        <Icon icon={<HomeIcon />} />
                    </ListItemGraphic>
                    Set as homepage
                </MenuItem>
            )}
        </ConfirmationDialog>
    );
};

export default React.memo(SetAsHomepageButton);
