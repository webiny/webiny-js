import React from "react";

import { ButtonDefault } from "@webiny/ui/Button";

type Props = {
    onClick: Function;
};

export const CreateButton: React.FC<Props> = ({ onClick }) => {
    return <ButtonDefault onClick={() => onClick()}>Create new</ButtonDefault>;
};
