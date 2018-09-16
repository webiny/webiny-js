//@flow
import React from "react";
import styled, { keyframes } from "react-emotion";
import { connect } from "react-redux";
import { Elevation } from "webiny-ui/Elevation";
import { ButtonFloating } from "webiny-ui/Button";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { ReactComponent as AddIcon } from "webiny-app-cms/editor/assets/icons/add.svg";
import { getBlocksCount } from "./selectors";

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(0,204,176, 0.4);
  }
  70% {
      box-shadow: 0 0 0 30px rgba(0,204,176, 0);
  }
  100% {
      box-shadow: 0 0 0 0 rgba(0,204,176, 0);
  }
`;

const AddBlockContainer = styled("div")({
    position: "fixed",
    zIndex: 5,
    top: 0,
    left: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    borderRadius: 2,
    color: "var(--mdc-theme-on-surface)",
    marginLeft: 54
});

const AddBlockContent = styled("div")({
    width: 300,
    margin: 5,
    textAlign: "center",
    display: "flex",
    alignItems: "center"
});

const AddContent = ({ blocks, togglePlugin }) => {
    if (blocks) {
        return null;
    }

    return (
        <AddBlockContainer data-type={"container"}>
            <Elevation
                z={4}
                style={{
                    backgroundColor: "var(--mdc-theme-surface)",
                    padding: "30px 20px",
                    transform: "translateY(-50%)",
                    borderRadius: 2
                }}
            >
                <AddBlockContent>
                    Click the
                    <ButtonFloating
                        style={{ animation: pulse + " 3s ease infinite", margin: "0 10px" }}
                        small
                        icon={<AddIcon />}
                        onClick={() => togglePlugin({ name: "search-blocks-bar" })}
                    />
                    to start adding content
                </AddBlockContent>
            </Elevation>
        </AddBlockContainer>
    );
};

export default connect(
    state => ({ blocks: getBlocksCount(state) }),
    { togglePlugin }
)(AddContent);
