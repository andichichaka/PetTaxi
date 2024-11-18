import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string;

    @Column({nullable: true})
    role: string;
}