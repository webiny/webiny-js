import React from "react";
import { TopProgressBar } from "..";

const withTopProgressBar = () => {
    return (BaseComponent: React.ComponentType<any>) => {
        const WithTopProgressBar = (props: any) => {
            return (
                <TopProgressBar>
                    {({ start, finish, nprogress }) => (
                        <BaseComponent
                            {...props}
                            startTopProgressBar={start}
                            finishTopProgressBar={finish}
                            nprogress={nprogress}
                        />
                    )}
                </TopProgressBar>
            );
        };

        return WithTopProgressBar;
    };
};

export default withTopProgressBar;
