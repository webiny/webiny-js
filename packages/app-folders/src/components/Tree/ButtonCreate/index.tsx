import React from "react";

import { ReactComponent as Plus } from "@material-design-icons/svg/filled/add_circle_outline.svg";
import { i18n } from "@webiny/app/i18n";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";

type Props = {
    onClick: Function;
};

const t = i18n.ns("app-folders/components/tree/button-create");

export const CreateButton: React.FC<Props> = ({ onClick }) => {
    return (
        <ButtonDefault onClick={() => onClick()} small={true} ripple={false}>
            <ButtonIcon icon={<Plus />} />
            {t`Create new`}
        </ButtonDefault>
    );
};
