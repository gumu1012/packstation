/* eslint-disable @typescript-eslint/no-magic-numbers */

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Entity-Klasse für Adresse ohne TypeORM.
 */
export class AdresseDTO {
    @Matches('^\\w.*')
    @MaxLength(40)
    @ApiProperty({ example: 'Die Straße', type: String })
    readonly strasse!: string;

    @Matches('^\\d.*')
    @MaxLength(40)
    @ApiProperty({ example: 'Die Hausnummer', type: String })
    readonly hausnummer!: string;

    @Matches('^\\d.*')
    @MaxLength(10)
    @ApiProperty({ example: 'Die Postleitzahl', type: String })
    readonly postleitzahl!: string;

    @Matches('^\\w.*')
    @IsOptional()
    @MaxLength(40)
    @ApiProperty({ example: 'Die Stadt', type: String })
    readonly stadt!: string;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
