//@flow
import React from "react";
import styled from "react-emotion";
import Droppable from "./../Droppable";
import { getElementProps } from "webiny-app-cms/editor/selectors";
import { connect } from "react-redux";

const Container = styled("div")(({ isOver }) => ({
    //backgroundColor: isOver ? "#d4d4d4" : "#e8e8e8",
    backgroundColor: "transparent",
    //boxShadow: isOver ? "inset 0px 0px 0px 1px var(--mdc-theme-primary)" : "none",
    /*
    boxShadow: ()=>{
        if(isOver){
            return "inset 0px 0px 0px 2px var(--mdc-theme-primary)"
        } else if (highlight){
            return 'inset 0px 0px 0px 2px var(--mdc-theme-secondary)'
        }else{
            return 'none'
        }
    },
    */
    boxSizing: "border-box",
    height: "100%",
    minHeight: 100,
    position: "relative",
    userSelect: "none",
    width: "100%",
    "&:hover": {
        //boxShadow: (isOver) ? "inset 0px 0px 0px 2px var(--mdc-theme-primary)" : 'inset 0px 0px 0px 2px var(--mdc-theme-secondary)'
    },
    ".addIcon": {
        color: isOver
            ? "var(--mdc-theme-primary) !important"
            : "var(--mdc-theme-secondary) !important"
    }
}));

const Add = styled("div")({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    margin: 0
});

const isVisible = () => true;

const Center = ({ type, onDrop, children, active, highlight }) => {
    return (
        <Droppable onDrop={onDrop} type={type} isVisible={isVisible}>
            {({ isOver, isDroppable }) => (
                <Container isOver={(isOver && isDroppable) || active} highlight={highlight}>
                    <Add>{children}</Add>
                </Container>
            )}
        </Droppable>
    );
};

export default connect((state, props) => {
    return getElementProps(state, props);
})(Center);
