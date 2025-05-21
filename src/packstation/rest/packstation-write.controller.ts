/**
 * Das Modul besteht aus der Controller-Klasse für Schreiben an der REST-Schnittstelle.
 * @packageDocumentation
 */

import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiHeader,
    ApiNoContentResponse,
    ApiOperation,
    ApiPreconditionFailedResponse,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import {
    Body,
    Controller,
    Delete,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {
    PackstationDTO,
    PackstationDtoOhneRef,
} from './packstationDTO.entity.js';
import { Request, Response } from 'express';
import { type Adresse } from '../entity/adresse.entity.js';
import { type Packstation } from '../entity/packstation.entity.js';
import { PackstationWriteService } from '../service/packstation-write.service.js';
import { type Paket } from '../entity/paket.entity.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { getBaseUri } from './getBaseUri.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';

const MSG_FORBIDDEN = 'Kein Token mit ausreichender Berechtigung vorhanden';
/**
 * Die Controller-Klasse für die Verwaltung von Packstationen.
 */
@Controller(paths.rest)
@UseGuards(AuthGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Packstation REST-API')
@ApiBearerAuth()
export class PackstationWriteController {
    readonly #service: PackstationWriteService;

    readonly #logger = getLogger(PackstationWriteController.name);

    constructor(service: PackstationWriteService) {
        this.#service = service;
    }

    /**
     * Ein neues Packstation wird asynchron angelegt. Das neu anzulegende Packstation ist als
     * JSON-Datensatz im Request-Objekt enthalten. Wenn es keine
     * Verletzungen von Constraints gibt, wird der Statuscode `201` (`Created`)
     * gesetzt und im Response-Header wird `Location` auf die URI so gesetzt,
     * dass damit das neu angelegte Packstation abgerufen werden kann.
     *
     * Falls Constraints verletzt sind, wird der Statuscode `400` (`Bad Request`)
     * gesetzt und genauso auch wenn die Stadt oder die Packstations-Nummer bereits
     * existieren.
     *
     * @param packstationDTO JSON-Daten für ein Packstation im Request-Body.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Post()
    @Roles('admin', 'user')
    @ApiOperation({ summary: 'Eine neue Packstation anlegen' })
    @ApiCreatedResponse({ description: 'Erfolgreich neu angelegt' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Packstationdaten' })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async post(
        @Body() packstationDTO: PackstationDTO,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug('post: packstationDTO=%o', packstationDTO);

        const packstation = this.#packstationDtoToPackstation(packstationDTO);
        const id = await this.#service.create(packstation);

        const location = `${getBaseUri(req)}/${id}`;
        this.#logger.debug('post: location=%s', location);
        return res.location(location).send();
    }

    /**
     * Ein vorhandenes Packstation wird asynchron aktualisiert.
     *
     * Im Request-Objekt von Express muss die ID des zu aktualisierenden Packstationes
     * als Pfad-Parameter enthalten sein. Außerdem muss im Rumpf das zu
     * aktualisierende Packstation als JSON-Datensatz enthalten sein. Damit die
     * Aktualisierung überhaupt durchgeführt werden kann, muss im Header
     * `If-Match` auf die korrekte Version für optimistische Synchronisation
     * gesetzt sein.
     *
     * Bei erfolgreicher Aktualisierung wird der Statuscode `204` (`No Content`)
     * gesetzt und im Header auch `ETag` mit der neuen Version mitgeliefert.
     *
     * Falls die Versionsnummer fehlt, wird der Statuscode `428` (`Precondition
     * required`) gesetzt; und falls sie nicht korrekt ist, der Statuscode `412`
     * (`Precondition failed`). Falls Constraints verletzt sind, wird der
     * Statuscode `400` (`Bad Request`) gesetzt und genauso auch wenn die neue
     * Stad oder die neue Packstations-Nummer bereits existieren.
     *
     * @param packstationDTO Packstationdtaten im Body des Request-Objekts.
     * @param id Pfad-Paramater für die ID.
     * @param version Versionsnummer aus dem Header _If-Match_.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // eslint-disable-next-line max-params
    @Put(':id')
    @Roles('admin', 'user')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Eine vorhandene Packstation aktualisieren',
        tags: ['Aktualisieren'],
    })
    @ApiHeader({
        name: 'If-Match',
        description: 'Header für optimistische Synchronisation',
        required: false,
    })
    @ApiNoContentResponse({ description: 'Erfolgreich aktualisiert' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Packstationdaten' })
    @ApiPreconditionFailedResponse({
        description: 'Falsche Version im Header "If-Match"',
    })
    @ApiResponse({
        status: HttpStatus.PRECONDITION_REQUIRED,
        description: 'Header "If-Match" fehlt',
    })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async put(
        @Body() packstationDTO: PackstationDtoOhneRef,
        @Param('id') id: number,
        @Headers('If-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug(
            'put: id=%s, packstationDTO=%o, version=%s',
            id,
            packstationDTO,
            version,
        );

        if (version === undefined) {
            const msg = 'Header "If-Match" fehlt';
            this.#logger.debug('put: msg=%s', msg);
            return res
                .status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'application/json')
                .send(msg);
        }

        const packstation =
            this.#packstationDtoOhneRefToPackstation(packstationDTO);
        const neueVersion = await this.#service.update({
            id,
            packstation,
            version,
        });
        this.#logger.debug('put: version=%d', neueVersion);
        return res.header('ETag', `"${neueVersion}"`).send();
    }

    /**
     * Ein Packstation wird anhand seiner ID-gelöscht, die als Pfad-Parameter angegeben
     * ist. Der zurückgelieferte Statuscode ist `204` (`No Content`).
     *
     * @param id Pfad-Paramater für die ID.
     * @returns Leeres Promise-Objekt.
     */
    @Delete(':id')
    @Roles('admin')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Packstation mit der ID löschen' })
    @ApiNoContentResponse({
        description: 'Das Packstation wurde gelöscht oder war nicht vorhanden',
    })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async delete(@Param('id') id: number) {
        this.#logger.debug('delete: id=%s', id);
        await this.#service.delete(id);
    }

    #packstationDtoToPackstation(packstationDTO: PackstationDTO): Packstation {
        const adresseDTO = packstationDTO.adresse;
        const adresse: Adresse = {
            id: undefined,
            strasse: adresseDTO.strasse,
            hausnummer: adresseDTO.hausnummer,
            postleitzahl: adresseDTO.postleitzahl,
            stadt: adresseDTO.stadt,
            packstation: undefined,
        };
        const pakete: Paket[] | undefined = packstationDTO.pakete?.map(
            (paketDTO) => {
                const paket: Paket = {
                    id: undefined,
                    nummer: paketDTO.nummer,
                    maxGewichtInKg: paketDTO.maxGewichtInKg,
                    packstation: undefined,
                };
                return paket;
            },
        );
        const packstation = {
            id: undefined,
            version: undefined,
            nummer: packstationDTO.nummer,
            baudatum: packstationDTO.baudatum,
            ausstattung: packstationDTO.ausstattung,
            adresse,
            pakete,
            erzeugt: new Date(),
            aktualisiert: new Date(),
        };

        // Rueckwaertsverweise
        packstation.adresse.packstation = packstation;
        packstation.pakete?.forEach((paket) => {
            paket.packstation = packstation;
        });
        return packstation;
    }

    #packstationDtoOhneRefToPackstation(
        packstationDTO: PackstationDtoOhneRef,
    ): Packstation {
        return {
            id: undefined,
            version: undefined,
            nummer: packstationDTO.nummer,
            baudatum: packstationDTO.baudatum,
            ausstattung: packstationDTO.ausstattung,
            adresse: undefined,
            pakete: undefined,
            erzeugt: undefined,
            aktualisiert: new Date(),
        };
    }
}
