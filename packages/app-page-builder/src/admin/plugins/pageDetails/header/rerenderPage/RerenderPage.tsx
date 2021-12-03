import * as React from "react";
import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";
import { ListItemGraphic } from "@webiny/ui/List";
import { MenuItem } from "@webiny/ui/Menu";
import { Icon } from "@webiny/ui/Icon";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

import { ReactComponent as RerenderIcon } from "../../../../assets/refresh.svg";

const RERENDER_PAGE = gql`
    mutation PbPageRerender($id: ID!) {
        pageBuilder {
            rerenderPage(id: $id) {
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export default function RerenderPage(props) {
    const { page } = props;
    const { showSnackbar } = useSnackbar();
    const [requestChanges] = useMutation(RERENDER_PAGE);

    const handleClick = React.useCallback(async () => {
        const response = await requestChanges({
            variables: {
                id: page.id
            }
        });

        const { error } = response.data.pageBuilder.rerenderPage;
        if (error) {
            showSnackbar(error.message);
        } else {
            showSnackbar("Page rerendered successfully");
        }
    }, []);

    return (
        <MenuItem onClick={handleClick}>
            <ListItemGraphic>
                <Icon
                    data-testid="pb-page-details-header-page-options-menu-rerender"
                    icon={<RerenderIcon />}
                />
            </ListItemGraphic>
            Rerender
        </MenuItem>
    );
}
