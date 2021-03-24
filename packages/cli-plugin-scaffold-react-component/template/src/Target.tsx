import React, { useState } from "react";

const colors = ["#FF0000", "#F0F0F0", "#FF00FF", "#FFFFFF", "#00FFFF", "#0000FF"];

interface Style {
    backgroundColor?: string;
}

interface Props {
    id: number;
    value?: string;
}
const Target: React.FunctionComponent<Props> = ({ id, value }) => {
    const [style, setStyle] = useState<Style>({});

    const changeColor = () => {
        const color = colors[Math.floor(Math.random() * colors.length)];
        setStyle({
            backgroundColor: color
        });
    };
    return (
        <div style={style}>
            A component with id {id} and value {value === undefined ? "none" : value}.
            <br />
            Background color is: ${style.backgroundColor}
            <br />
            But we can set it to some random one with a click on the{" "}
            <button onClick={changeColor}>button</button>
        </div>
    );
};

export default Target;
