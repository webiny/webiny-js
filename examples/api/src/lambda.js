import serverless from "serverless-http";
import app from "./express";

export const handler = serverless(app());
