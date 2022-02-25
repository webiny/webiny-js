import * as React from "react";
import { useState, useEffect } from "react";
import type { FC } from "react";
import { Text } from "ink";
import spinners from "cli-spinners";
import type { SpinnerName } from "cli-spinners";

interface Props {
  type?: SpinnerName;
}

interface Props {
  label?: string;
}

export const Spinner: FC<Props> = ({ label = "Loading", type = "dots" }) => {
  const [frame, setFrame] = useState(0);
  const spinner = spinners[type];

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((previousFrame) => {
        const isLastFrame = previousFrame === spinner.frames.length - 1;
        return isLastFrame ? 0 : previousFrame + 1;
      });
    }, spinner.interval);

    return () => {
      clearInterval(timer);
    };
  }, [spinner]);

  return (
    <Text>
      {spinner.frames[frame]} {label}
    </Text>
  );
};
