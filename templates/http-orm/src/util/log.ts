import { CollectionLogger, TsLogLogger } from "@toes/core";
import { Logger } from "ts-log";
import { createLogger } from "bunyan";
import config from "config";

const bunLogger: Logger = createLogger({ name: config.get("app.name") });
export const logger = new CollectionLogger([new TsLogLogger(bunLogger)]);
