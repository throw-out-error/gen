import chalk from "chalk";
import { main } from "./index";

main().catch((err) => {
    if (err && err.message.trim() !== "") console.error(chalk.red(`${err}`));
    process.exit(1);
});
