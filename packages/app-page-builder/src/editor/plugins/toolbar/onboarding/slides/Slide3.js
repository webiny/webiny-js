//@flow
import React from "react";
import { css } from "emotion";
import { keyframes } from "emotion";
import classnames from "classnames";

import SlideOutline from "./SlideOutline";

import { ReactComponent as BlocksIcon } from "../assets/slide-3-icon.svg";
import { ReactComponent as HandIcon } from "../assets/hand-icon.svg";
import { ReactComponent as BlockMock } from "../assets/block-mock.svg";
import { ReactComponent as Hover } from "../assets/slide-3-hover.svg";
import { ReactComponent as ElementList } from "../assets/slide-3-element-list.svg";

const handPulsateSlide3 = keyframes`
    0% { 
        display: none; 
        visibility: hidden;
        opacity: 0; 
    }
    50% { 
        display: none; 
        visibility: hidden;
        opacity: 0; 
    }
    100% { 
        display: block; 
        visibility: block;
        opacity: 1;  
    }
`;

const elementListAppearSlide3 = keyframes`
    0% { 
        opacity: 0; 
    }
    90% { 
        opacity: 0;
        transform: translateX(-25px);
    }
    100% { 
        transform: translateX(0px);
        opacity: 1;  
    }
`;

const hoverAppearSlide3 = keyframes`
    0% { 
        opacity: 0; 
    }
    66% { 
        opacity: 0;
    }
    100% { 
        opacity: 1;  
    }
`;

const svgElement = css({
    display: "none",
    position: "absolute"
});

const handStylesSlide3 = css({
    display: "block",
    left: 38,
    top: 36,
    width: 25,
    height: "auto",
    zIndex: 10,
    animationName: handPulsateSlide3,
    animationIterationCount: 1,
    animationTimingFunction: "ease-in",
    animationDuration: "4s"
});

const blockMockStyleSlide3 = css({
    position: "absolute",
    display: "block",
    left: 115,
    top: 85
});

const hoverStyleSlide3 = css({
    left: 100,
    top: 70,
    display: "block",
    animationName: hoverAppearSlide3,
    animationIterationCount: 1,
    animationTimingFunction: "ease-in",
    animationDuration: "2s"
});

const elementListStyleSlide3 = css({
    left: 43,
    top: 32,
    display: "block",
    animationName: elementListAppearSlide3,
    animationIterationCount: 1,
    animationTimingFunction: "ease-in",
    animationDuration: "4s"
});

type Props = {
    currentSlide: number
};

class Slide3 extends React.Component<Props> {
    slideNumber = 3;
    editorContent = () => {
        return (
            <React.Fragment>
                <HandIcon
                    className={classnames(svgElement, {
                        [handStylesSlide3]: this.props.currentSlide === this.slideNumber
                    })}
                />
                <BlockMock className={blockMockStyleSlide3} />
                <Hover
                    className={classnames(svgElement, {
                        [hoverStyleSlide3]: this.props.currentSlide === this.slideNumber
                    })}
                />
                <ElementList
                    className={classnames(svgElement, {
                        [elementListStyleSlide3]: this.props.currentSlide === this.slideNumber
                    })}
                />
            </React.Fragment>
        );
    };

    render() {
        return (
            <SlideOutline
                title={"Rows"}
                description={
                    "Inside each block, you have one or more  rows. Rows are used to spread content\n" +
                    "vertically. To add a new row, click the plus icon in the top left corner, \n" +
                    "you will find rows under Layouts section."
                }
                learnMoreText={"Click here to learn more about Rows."}
                learnMoreLink={"https://docs.webiny.com/cms/rows"}
                icon={<BlocksIcon />}
                editorContent={this.editorContent()}
            />
        );
    }
}

export default Slide3;
