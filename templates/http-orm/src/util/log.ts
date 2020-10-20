import { CollectionLogger, TsLogLogger } from "@toes/core";
import { Logger } from "ts-log";
import { createLogger } from "bunyan";
import template from "../.template";

const bunLogger: Logger = createLogger({ name: template.name });
export const logger = new CollectionLogger([new TsLogLogger(bunLogger)]);
