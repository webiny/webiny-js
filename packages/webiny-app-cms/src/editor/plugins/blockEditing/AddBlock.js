//@flow
import React from "react";
import { connect } from "react-redux";
import styled from "react-emotion";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { ButtonFloating } from "webiny-ui/Button";
import { ReactComponent as AddIcon } from "webiny-app-cms/editor/assets/icons/add.svg";

const BottomRight = styled("div")({
    position: "fixed",
    zIndex: 6,
    bottom: 20,
    right: 20
});

const AddBlock = ({ togglePlugin }) => {
    return (
        <BottomRight>
            <ButtonFloating
                onClick={() => togglePlugin({ name: "cms-search-blocks-bar" })}
                icon={<AddIcon />}
            />
        </BottomRight>
    );
};

export default connect(
    null,
    { togglePlugin }
)(AddBlock);
