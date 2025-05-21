import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Packstation } from './packstation.entity.js';

@Entity()
export class Adresse {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar')
    readonly strasse: string | undefined;

    @Column('varchar')
    readonly hausnummer: string | undefined;

    @Column('integer')
    readonly postleitzahl: string | undefined;

    @Column('varchar')
    readonly stadt!: string;

    @OneToOne(() => Packstation, (packstation) => packstation.adresse)
    @JoinColumn({ name: 'packstation_id' })
    packstation: Packstation | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            strasse: this.strasse,
            hausnummer: this.hausnummer,
            postleitzahl: this.postleitzahl,
            stadt: this.stadt,
        });
}
