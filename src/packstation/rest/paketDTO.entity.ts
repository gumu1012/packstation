/* eslint-disable @typescript-eslint/no-magic-numbers */

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { ApiProperty } from '@nestjs/swagger';
import { MaxLength } from 'class-validator';

/**
 * Entity-Klasse für Paket ohne TypeORM.
 */
export class PaketDTO {
    @MaxLength(32)
    @ApiProperty({ example: 'Die Nummer', type: String })
    readonly nummer!: string;

    @ApiProperty({ example: '8.5', type: Number })
    readonly maxGewichtInKg!: number;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
