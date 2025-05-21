/* eslint-disable max-classes-per-file */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Das Modul besteht aus den Klassen für die Fehlerbehandlung bei der Verwaltung
 * von Büchern, z.B. beim DB-Zugriff.
 * @packageDocumentation
 */

/**
 * Exception-Klasse für eine bereits existierende name-Nummer.
 */
export class PackstationNummerExistsException extends HttpException {
     readonly nummer: string;

    constructor(nummer: string) {
        super(
            `Die Nummer ${nummer} existiert bereits.`,
            HttpStatus.UNPROCESSABLE_ENTITY,
        );
        this.nummer = nummer;
    }
}

export class PackstationNotFoundException extends HttpException {
    readonly id: number | undefined
    constructor(id: number | undefined) {
        super(
            `Die Packstation mit der ID ${id} wurde nicht gefunden.`,
            HttpStatus.NOT_FOUND,
        );
    }
}

/**
 * Exception-Klasse für eine ungültige Versionsnummer beim Ändern.
 */
export class VersionInvalidException extends HttpException {
    readonly version: string | undefined;

    constructor(version: string | undefined) {
        super(
            `Die Versionsnummer ${version} ist ungueltig.`,
            HttpStatus.PRECONDITION_FAILED,
        );
        this.version = version;
    }
}

/**
 * Exception-Klasse für eine veraltete Versionsnummer beim Ändern.
 */
export class VersionOutdatedException extends HttpException {
    readonly version: number;

    constructor(version: number) {
        super(
            `Die Versionsnummer ${version} ist nicht aktuell.`,
            HttpStatus.PRECONDITION_FAILED,
        );
        this.version = version;
    }
}

