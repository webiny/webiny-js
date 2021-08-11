import React, { useCallback, useMemo, useState } from "react";
import styled from "@emotion/styled";
import { CountdownCircleTimer } from "react-countdown-circle-timer";

// Components
import CreateWebinyProjectDemo from "./CreateWebinyProjectDemo";
import DeployWebinyProjectDemo from "./DeployWebinyProjectDemo";
// Assets
import stepDivider from "./assets/step-divider.svg";
// @ts-ignore
import enjoyVideo from "./assets/webiny-install-enjoy-step.mp4";

const Wrapper = styled("div")({
    display: "flex",
    flexDirection: "column"
});

const Content = styled("div")({
    width: "100%",
    height: 368,
    marginTop: 25,
    position: "relative",
    "& .Terminal-control-btn": {
        display: "none"
    }
});

const Spinner = styled("div")({
    position: "absolute",
    bottom: 15,
    right: 15,
    cursor: "pointer"
});

const Steps = styled("div")({
    display: "flex",
    width: "100%",
    fontSize: 22,
    fontWeight: 600,
    alignItems: "center",
    lineHeight: "100%"
});

const Step = styled("div")({
    display: "block",
    color: "#CBCBCB",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    padding: "0 0 10px 0",
    marginLeft: 10,
    "&:hover": {
        color: "#fff"
    },
    "&.active": {
        color: "#DBD346",
        borderColor: "#DBD346"
    },
    ".webiny-pb-media-query--mobile-portrait &": {
        padding: "0 0 5px 0"
    }
});

const StepDivider = styled("div")({
    display: "block",
    width: 15,
    height: 25,
    margin: "0 40px",
    backgroundImage: "url(" + stepDivider + ");",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    marginBottom: 9,
    opacity: 0.7,
    ".webiny-pb-media-query--mobile-portrait &": {
        margin: "0 10px"
    }
});

const Video = styled("video")({
    borderRadius: 5,
    boxShadow: "0 2px 4px 0 rgba(0,0,0,0.25)",
    height: "auto",
    maxHeight: 363,
    width: "100%",
    maxWidth: 567
});

const LOOP_ANIMATION = true;
const LOOP_DELAY = 0;

const Stepper: React.FunctionComponent = () => {
    const [activeTab, setActiveTab] = useState<number>(1);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);

    const tabs = useMemo(() => {
        return {
            1: {
                content: <CreateWebinyProjectDemo />,
                duration: 12
            },
            2: {
                content: <DeployWebinyProjectDemo />,
                duration: 10
            },
            3: {
                content: <Video controls={false} autoPlay={true} src={enjoyVideo} />,
                duration: 15
            }
        };
    }, []);

    const changeTab = useCallback((tab: number) => {
        setActiveTab(tab);
        setIsPlaying(true);
    }, []);

    return (
        <Wrapper>
            <Steps>
                <Step className={activeTab === 1 && "active"} onClick={() => changeTab(1)}>
                    Create
                </Step>
                <StepDivider />
                <Step className={activeTab === 2 && "active"} onClick={() => changeTab(2)}>
                    Deploy
                </Step>
                <StepDivider />
                <Step className={activeTab === 3 && "active"} onClick={() => changeTab(3)}>
                    Enjoy
                </Step>
            </Steps>
            <Content>
                {tabs[activeTab].content}
                <Spinner
                    onClick={() => {
                        setIsPlaying(prevState => !prevState);
                    }}
                >
                    <CountdownCircleTimer
                        key={activeTab}
                        isPlaying={isPlaying}
                        duration={tabs[activeTab].duration}
                        colors={"#E8653B"}
                        onComplete={() => {
                            // Repeat tabs in loop
                            changeTab((activeTab % 3) + 1);
                            return [LOOP_ANIMATION, LOOP_DELAY];
                        }}
                        size={24}
                        strokeWidth={3}
                        strokeLinecap={"square"}
                    />
                </Spinner>
            </Content>
        </Wrapper>
    );
};

export default Stepper;
