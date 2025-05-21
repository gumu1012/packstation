import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Packstation } from './packstation.entity.js';

@Entity()
export class Paket {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar')
    readonly nummer: string | undefined;

    @Column('decimal', {
        precision: 8,
        scale: 2,
    })
    @ApiProperty({ example: 0.5, type: Number })
    readonly maxGewichtInKg: number | undefined;

    @ManyToOne(() => Packstation, (packstation) => packstation.pakete)
    @JoinColumn({ name: 'packstation_id' })
    packstation: Packstation | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            nummer: this.nummer,
            maxGewichtInKg: this.maxGewichtInKg,
        });
}
