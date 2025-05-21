// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable max-lines */
/**
 * Das Modul besteht aus der Controller-Klasse für Lesen an der REST-Schnittstelle.
 * @packageDocumentation
 */

// eslint-disable-next-line max-classes-per-file
import {
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    NotFoundException,
    Param,
    Query,
    Req,
    Res,
    UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { type Adresse } from '../entity/adresse.entity.js';
import { type Packstation } from '../entity/packstation.entity';
import { PackstationReadService } from '../service/packstation-read.service.js';
import { Public } from 'nest-keycloak-connect';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { type Suchkriterien } from '../service/suchkriterien.js';
import { getBaseUri } from './getBaseUri.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';

/** href-Link für HATEOAS */
export interface Link {
    /** href-Link für HATEOAS-Links */
    readonly href: string;
}

/** Links für HATEOAS */
export interface Links {
    /** self-Link */
    readonly self: Link;
    /** Optionaler Linke für list */
    readonly list?: Link;
    /** Optionaler Linke für add */
    readonly add?: Link;
    /** Optionaler Linke für update */
    readonly update?: Link;
    /** Optionaler Linke für remove */
    readonly remove?: Link;
}

/** Typedefinition für ein Adresse-Objekt ohne Rückwärtsverweis zur Packstation */
export type AdresseModel = Omit<Adresse, 'packstation' | 'id'>;

/** Packstation-Objekt mit HATEOAS-Links */
export type PackstationModel = Omit<
    Packstation,
    'pakete' | 'aktualisiert' | 'erzeugt' | 'id' | 'adresse' | 'version'
> & {
    adresse: AdresseModel;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links: Links;
};

/** Packstation-Objekte mit HATEOAS-Links in einem JSON-Array. */
export interface PackstationenModel {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _embedded: {
        packstationen: PackstationModel[];
    };
}

/**
 * Klasse für `PackstationGetController`, um Queries in _OpenAPI_ bzw. Swagger zu
 * formulieren. `PackstationController` hat dieselben Properties wie die Basisklasse
 * `Packstation` - allerdings mit dem Unterschied, dass diese Properties beim Ableiten
 * so überschrieben sind, dass sie auch nicht gesetzt bzw. undefined sein
 * dürfen, damit die Queries flexibel formuliert werden können. Deshalb ist auch
 * immer der zusätzliche Typ undefined erforderlich.
 * Außerdem muss noch `string` statt `Date` verwendet werden, weil es in OpenAPI
 * den Typ Date nicht gibt.
 */
export class PackstationQuery implements Suchkriterien {
    @ApiProperty({ required: false })
    declare readonly nummmer: string | undefined;

    @ApiProperty({ required: false })
    readonly baudatumVon?: Date;

    @ApiProperty({ required: false })
    readonly baudatumBis?: Date;

    @ApiProperty({ required: false })
    declare readonly bildschirm: string;

    @ApiProperty({ required: false })
    declare readonly bluetooth: string;

    @ApiProperty({ required: false })
    readonly hatPakete?: boolean;

    @ApiProperty({ required: false })
    readonly stadt?: string;
}

const APPLICATION_HAL_JSON = 'application/hal+json';

/**
 * Die Controller-Klasse für die Verwaltung von Packstationen.
 */
@Controller(paths.rest)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Packstation REST-API')
// @ApiBearerAuth()
export class PackstationGetController {
    readonly #service: PackstationReadService;

    readonly #logger = getLogger(PackstationGetController.name);

    constructor(service: PackstationReadService) {
        this.#service = service;
    }

    /**
     * Ein Packstation wird asynchron anhand seiner ID als Pfadparameter gesucht.
     *
     * Falls es ein solches Packstation gibt und `If-None-Match` im Request-Header
     * auf die aktuelle Version des Packstationes gesetzt war, wird der Statuscode
     * `304` (`Not Modified`) zurückgeliefert. Falls `If-None-Match` nicht
     * gesetzt ist oder eine veraltete Version enthält, wird die gefundene
     * Packstation im Rumpf des Response als JSON-Datensatz mit Atom-Links für HATEOAS
     * und dem Statuscode `200` (`OK`) zurückgeliefert.
     *
     * Falls es keine Packstation zur angegebenen ID gibt, wird der Statuscode `404`
     * (`Not Found`) zurückgeliefert.
     *
     * @param idStr Pfad-Parameter `id`
     * @param req Request-Objekt von Express mit Pfadparameter, Query-String,
     *            Request-Header und Request-Body.
     * @param version Versionsnummer im Request-Header bei `If-None-Match`
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // eslint-disable-next-line max-params, max-lines-per-function
    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Suche mit der Packstation-ID' })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 1',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header für bedingte GET-Requests, z.B. "0"',
        required: false,
    })
    @ApiOkResponse({ description: 'Die Packstation wurde gefunden' })
    @ApiNotFoundResponse({ description: 'Keine Packstation zur ID gefunden' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Die Packstation wurde bereits heruntergeladen',
    })
    async getById(
        @Param('id') idStr: string,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response<PackstationModel | undefined>> {
        this.#logger.debug('getById: idStr=%s, version=%s', idStr, version);
        const id = Number(idStr);
        if (!Number.isInteger(id)) {
            this.#logger.debug('getById: not isInteger()');
            throw new NotFoundException(
                `Die Packstation-ID ${idStr} ist ungueltig.`,
            );
        }

        if (req.accepts([APPLICATION_HAL_JSON, 'json', 'html']) === false) {
            this.#logger.debug('getById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const packstation = await this.#service.findById({ id });
        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'getById(): packstation=%s',
                packstation.toString(),
            );
            this.#logger.debug('getById(): adresse=%o', packstation.adresse);
        }

        // ETags
        const versionDb = packstation.version;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('getById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('getById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        // HATEOAS mit Atom Links und HAL (= Hypertext Application Language)
        const packstationModel = this.#toModel(packstation, req);
        this.#logger.debug('getById: packstationModel=%o', packstationModel);
        return res.contentType(APPLICATION_HAL_JSON).json(packstationModel);
    }

    /**
     * Packstationen werden mit Query-Parametern asynchron gesucht. Falls es mindestens
     * ein solche Packstation gibt, wird der Statuscode `200` (`OK`) gesetzt. Im Rumpf
     * des Response ist das JSON-Array mit den gefundenen Packstationen, die jeweils
     * um Atom-Links für HATEOAS ergänzt sind.
     *
     * Falls es keine passenden Packstationen gibt, wird der Statuscode `404`
     * (`Not Found`) gesetzt.
     *
     * Ohne Query-Parameter, werden alle Packstationen ermittelt.
     *
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get()
    @Public()
    @ApiOperation({ summary: 'Suche mit Suchkriterien' })
    @ApiOkResponse({ description: 'Eine evtl. leere Liste mit Packstationen' })
    async get(
        @Query() query: PackstationQuery,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response<PackstationenModel | undefined>> {
        this.#logger.debug('get: query=%o', query);

        if (req.accepts([APPLICATION_HAL_JSON, 'json', 'html']) === false) {
            this.#logger.debug('get: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const packstationen = await this.#service.find(query);
        this.#logger.debug('get: %o', packstationen);

        // HATEOAS: Atom Links je Packstation
        const packstationenModel = packstationen.map((packstation) =>
            this.#toModel(packstation, req, false),
        );
        this.#logger.debug('get: packstationenModel=%o', packstationenModel);

        const result: PackstationenModel = {
            _embedded: { packstationen: packstationenModel },
        };
        return res.contentType(APPLICATION_HAL_JSON).json(result).send();
    }

    #toModel(packstation: Packstation, req: Request, all = true) {
        const baseUri = getBaseUri(req);
        this.#logger.debug('#toModel: baseUri=%s', baseUri);
        const { id } = packstation;
        const links = all
            ? {
                  self: { href: `${baseUri}/${id}` },
                  list: { href: `${baseUri}` },
                  add: { href: `${baseUri}` },
                  update: { href: `${baseUri}/${id}` },
                  remove: { href: `${baseUri}/${id}` },
              }
            : { self: { href: `${baseUri}/${id}` } };

        this.#logger.debug(
            '#toModel: packstation=%o, links=%o',
            packstation,
            links,
        );
        const adresseModel: AdresseModel = {
            strasse: packstation.adresse?.strasse ?? 'N/A',
            hausnummer: packstation.adresse?.hausnummer ?? 'N/A',
            postleitzahl: packstation.adresse?.postleitzahl ?? 'N/A',
            stadt: packstation.adresse?.stadt ?? 'N/A',
        };
        const packstationModel: PackstationModel &
            Omit<
                Packstation,
                | 'pakete'
                | 'aktualisiert'
                | 'erzeugt'
                | 'id'
                | 'adresse'
                | 'version'
            > = {
            nummer: packstation.nummer,
            baudatum: packstation.baudatum,
            ausstattung: packstation.ausstattung,
            adresse: adresseModel,
            _links: links,
        };

        return packstationModel;
    }
}
