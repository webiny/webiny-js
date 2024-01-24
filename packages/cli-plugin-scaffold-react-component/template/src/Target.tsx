import React, { useState } from "react";

interface Props {
    id?: number;
}
const Target = ({ id }: Props) => {
    const [randomNumber, setRandomNumber] = useState<number>();

    return (
        <div>
            <div>ID: {id || "N/A"}</div>
            <div>Random Number: {randomNumber || "N/A"}</div>
            <div>
                <button onClick={() => setRandomNumber(Math.random())}>
                    Generate Random Number
                </button>
            </div>
        </div>
    );
};

export default Target;
