// eslint-disable-next-line max-classes-per-file
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { IsInt, IsNumberString, Min } from 'class-validator';
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { type Adresse } from '../entity/adresse.entity.js';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { type IdInput } from './packstation-query.resolver.js';
import { type Packstation } from '../entity/packstation.entity.js';
import { PackstationDTO } from '../rest/packstationDTO.entity.js';
import { PackstationWriteService } from '../service/packstation-write.service.js';
import { type Paket } from '../entity/paket.entity.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { getLogger } from '../../logger/logger.js';

// Authentifizierung und Autorisierung durch
//  GraphQL Shield

export interface CreatePayload {
    readonly id: number;
}

export interface UpdatePayload {
    readonly version: number;
}

export class PackstationUpdateDTO extends PackstationDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}
@Resolver()
@UseGuards(AuthGuard)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class PackstationMutationResolver {
    readonly #service: PackstationWriteService;

    readonly #logger = getLogger(PackstationMutationResolver.name);

    constructor(service: PackstationWriteService) {
        this.#service = service;
    }

    @Mutation()
    @Roles('admin', 'user')
    async create(@Args('input') packstationDTO: PackstationDTO) {
        this.#logger.debug('create: packstationDTO=%o', packstationDTO);

        const packstation = this.#packstationDtoToPackstation(packstationDTO);
        const id = await this.#service.create(packstation);
        this.#logger.debug('createPackstation: id=%d', id);
        const payload: CreatePayload = { id };
        return payload;
    }

    @Mutation()
    @Roles('admin', 'user')
    async update(@Args('input') packstationDTO: PackstationUpdateDTO) {
        this.#logger.debug('update: packstation=%o', packstationDTO);

        const packstation =
            this.#packstationUpdateDtoToPackstation(packstationDTO);
        const versionStr = `"${packstationDTO.version.toString()}"`;

        const versionResult = await this.#service.update({
            id: Number.parseInt(packstationDTO.id, 10),
            packstation,
            version: versionStr,
        });
        this.#logger.debug(
            'updatePackstation: versionResult=%d',
            versionResult,
        );
        const payload: UpdatePayload = { version: versionResult };
        return payload;
    }

    @Mutation()
    @Roles('admin')
    async delete(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('delete: id=%s', idStr);
        const deletePerformed = await this.#service.delete(idStr);
        this.#logger.debug(
            'deletePackstation: deletePerformed=%s',
            deletePerformed,
        );
        return deletePerformed;
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
        const pakete = packstationDTO.pakete?.map((paketDTO) => {
            const paket: Paket = {
                id: undefined,
                nummer: paketDTO.nummer,
                maxGewichtInKg: paketDTO.maxGewichtInKg,
                packstation: undefined,
            };
            return paket;
        });
        const packstation: Packstation = {
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

        // Rueckwaertsverweis
        packstation.adresse!.packstation = packstation;
        return packstation;
    }

    #packstationUpdateDtoToPackstation(
        packstationDTO: PackstationUpdateDTO,
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
