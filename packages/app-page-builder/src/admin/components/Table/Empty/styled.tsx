import styled from "@emotion/styled";
import { ReactComponent as Add } from "@material-design-icons/svg/filled/add.svg";

export const Buttons = styled("div")`
    > button {
        margin: 0 8px;
    }
`;

export const Icon = styled(Add)`
    fill: var(--mdc-theme-primary);
    width: 18px;
    margin-right: 8px;
`;
