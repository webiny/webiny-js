import React from "react";
import { withRouter, type WithRouterProps } from "webiny-app/components";
import { type WithPageDetailsProps } from "webiny-app-cms/admin/components";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";
import { ReactComponent as EditIcon } from "webiny-app-cms/admin/assets/edit.svg";

type Props = WithPageDetailsProps & WithRouterProps;

const EditRevision = ({ pageDetails: { page }, router }: Props) => {
    return (
        <Tooltip content={"Edit"} placement={"top"}>
            <IconButton
                icon={<EditIcon />}
                onClick={() =>
                    router.goToRoute({
                        name: "Cms.Editor",
                        params: { id: page.id }
                    })
                }
            />
        </Tooltip>
    );
};

export default withRouter()(EditRevision);
