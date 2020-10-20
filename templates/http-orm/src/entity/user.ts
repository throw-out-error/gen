import { Column } from "typeorm";
import { BaseEntity } from "./base";

export class User extends BaseEntity {
    @Column()
    username: string;

    @Column()
    password: string;

    @Column({ nullable: true })
    name?: string;
}
