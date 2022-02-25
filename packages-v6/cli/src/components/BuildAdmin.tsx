import React, { useEffect, useState } from "react";
import { useCLI } from "./CLI";
import { Spinner } from "./Spinner";
import { Text, useApp } from "ink";
import buildAdmin from "../buildAdmin";

enum Status {
  BUILDING,
  DONE,
}

export const BuildAdmin: React.FC = () => {
  const { exit } = useApp();
  const { output, plugins } = useCLI();
  const [status, setStatus] = useState<Status>(Status.BUILDING);

  useEffect(() => {
    buildAdmin({ output, plugins }).then(() => {
      setTimeout(() => {
        setStatus(Status.DONE);
        exit();
      }, 2000);
    });
  }, []);

  return status === Status.BUILDING ? (
      <Spinner label={"Building admin app..."} />
  ) : (
      <Text>Done!</Text>
  );
};
