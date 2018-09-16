//@flow
import React from "react";
import { css } from "emotion";
import { keyframes } from "react-emotion";
import classnames from "classnames";

import SlideOutline from "./SlideOutline";

import { ReactComponent as BlocksIcon } from "../assets/slide-6-icon.svg";
import { ReactComponent as HandIcon } from "../assets/hand-icon.svg";
import { ReactComponent as BlockMock } from "../assets/block-mock.svg";
import { ReactComponent as Hover } from "../assets/slide-6-hover.svg";
import { ReactComponent as Dialog } from "../assets/slide-6-dialog.svg";
import { ReactComponent as Toolbar } from "../assets/slide-6-toolbar.svg";

const handPulsateSlide6 = keyframes`
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

const toolbarListAppearSlide6 = keyframes`
    0% { 
        opacity: 0; 
    }
    50% { 
        opacity: 0;
        transform: translateY(-25px);
    }
    100% { 
        transform: translateY(0px);
        opacity: 1;  
    }
`;

const hoverHightlightSlide6 = keyframes`
    0% { 
        opacity:0;
    }
    50% { 
        opacity:0;
    }
    100% { 
        opacity:1;  
    }
`;

const svgElementSlide6 = css({
    display: "none",
    position: "absolute"
});

const handStylesSlide6 = css({
    display: "block",
    left: 490,
    top: 170,
    width: 25,
    height: "auto",
    zIndex: 10,
    animationName: handPulsateSlide6,
    animationIterationCount: 1,
    animationTimingFunction: "ease-in",
    animationDuration: "2s"
});

const blockMockStyleSlide6 = css({
    position: "absolute",
    display: "block",
    left: 115,
    top: 85
});

const hoverStyleSlide6 = css({
    position: "absolute",
    left: 110,
    top: 81,
    display: "block"
});

const hoverStyleSlide6AnimInit = css({
   opacity: 0
});

const hoverStyleSlide6Anim = css({
    ".highlighted-layer": {
        animationName: hoverHightlightSlide6,
        animationIterationCount: 1,
        animationTimingFunction: "ease-in",
        animationDuration: "1s"
    }
});

const toolbarStyleSlide6 = css({
    left: 40,
    top: 1,
    display: "block",
    position: "absolute",
    animationName: toolbarListAppearSlide6,
    animationIterationCount: 1,
    animationTimingFunction: "ease-in",
    animationDuration: "3s"
});

const dialogStyleSlide6 = css({
    left: 394,
    top: 30,
    display: "block",
    position: "absolute",
    animationName: toolbarListAppearSlide6,
    animationIterationCount: 1,
    animationTimingFunction: "ease-in",
    animationDuration: "4s"
});

type Props = {
    currentSlide: number
};

class Slide6 extends React.Component<Props> {
    slideNumber = 6;
    editorContent = () => {
        return (
            <React.Fragment>
                <HandIcon
                    className={classnames(svgElementSlide6, {
                        [handStylesSlide6]: this.props.currentSlide === this.slideNumber
                    })}
                />
                <BlockMock className={blockMockStyleSlide6} />
                <Hover
                    className={classnames(hoverStyleSlide6, {
                        [hoverStyleSlide6Anim]: this.props.currentSlide === this.slideNumber,
                        [hoverStyleSlide6AnimInit]: this.props.currentSlide !== this.slideNumber
                    })}
                />
                <Toolbar
                    className={classnames(svgElementSlide6, {
                        [toolbarStyleSlide6]: this.props.currentSlide === this.slideNumber
                    })}
                />
                <Dialog
                    className={classnames(svgElementSlide6, {
                        [dialogStyleSlide6]: this.props.currentSlide === this.slideNumber
                    })}
                />
            </React.Fragment>
        );
    };

    render() {
        return (
            <SlideOutline
                title={"Style & Positioning"}
                description={
                    "When you hover over a layer, click on it to select it. On the top of the page, you will see \n" +
                    "additional options to control the visual styles of that layer.\n" +
                    "Layers can also be dragged and dropped, to change their position on the page."
                }
                learnMoreText={"Click here to learn more about Style & Positioning."}
                learnMoreLink={"https://docs.webiny.com/cms/style-and-positioning"}
                icon={<BlocksIcon />}
                editorContent={this.editorContent()}
            />
        );
    }
}

export default Slide6;
