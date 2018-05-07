import serverless from "serverless-http";
import app from "./graphql";

export const handler = serverless(app());
