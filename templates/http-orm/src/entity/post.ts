import { Column } from "typeorm";
import { BaseEntity } from "./base";

export class Post extends BaseEntity {
    @Column()
    title: string;

    @Column()
    content: string;
}
