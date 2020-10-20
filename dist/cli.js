"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const index_1 = require("./index");
index_1.main().catch((err) => {
    if (err && err.message.trim() !== "")
        console.error(chalk_1.default.red(`${err}`));
    process.exit(1);
});
