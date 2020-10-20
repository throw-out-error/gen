import { ConnectionOptions, createConnection, useContainer } from "typeorm";
import { Container } from "typedi";
import { useExpressServer } from "routing-controllers";
import { PostController } from "./controller/post-controller";
import express from "express";
import config from "config";
import { User } from "./entity/user";
import { Post } from "./entity/post";

useContainer(Container);
createConnection({
    ...(config.get("database") as ConnectionOptions),
    entities: [User, Post],
    synchronize: true,
    logging: true,
})
    .then(() => {
        console.log("Connected to database. Starting express app");

        const app = express();

        useExpressServer(app, {
            controllers: [PostController],
        }).listen(3000);
        console.log(
            "Server is up and running on port 3000. Now send requests to check if everything works."
        );
    })
    .catch((error) => console.log("Error: ", error));
