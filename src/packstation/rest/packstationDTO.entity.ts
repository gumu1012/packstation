/* eslint-disable max-classes-per-file */

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import {
    ArrayUnique,
    IsArray,
    IsISO8601,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

import { AdresseDTO } from './adresseDTO.entity.js';
import { ApiProperty } from '@nestjs/swagger';
import { PaketDTO } from './paketDTO.entity.js';
import { Type } from 'class-transformer';

export const MAX_RATING = 5;

/**
 * Entity-Klasse für Packstationen ohne TypeORM und ohne Referenzen.
 */
export class PackstationDtoOhneRef {
    // https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s13.html
    @IsString()
    @ApiProperty({ example: '12345', type: String })
    readonly nummer!: string;

    @IsISO8601({ strict: true })
    @IsOptional()
    @ApiProperty({ example: '2021-06-01' })
    readonly baudatum: Date | string | undefined;

    @IsOptional()
    @ArrayUnique()
    @ApiProperty({ example: ['BILDSCHIRM', 'BLUETOOTH'] })
    readonly ausstattung: string[] | undefined;
}

/**
 * Entity-Klasse für Packstationen ohne TypeORM.
 */
export class PackstationDTO extends PackstationDtoOhneRef {
    @ValidateNested()
    @Type(() => AdresseDTO)
    @ApiProperty({ type: AdresseDTO })
    readonly adresse!: AdresseDTO; // NOSONAR

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PaketDTO)
    @ApiProperty({ type: [PaketDTO] })
    readonly pakete: PaketDTO[] | undefined;

    // PaketDTO
}
/* eslint-enable max-classes-per-file */
