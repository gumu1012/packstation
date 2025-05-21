/**
 * Das Modul besteht aus der Klasse {@linkcode PackstationWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */
import { type DeleteResult, Repository } from 'typeorm';
import {
    PackstationNotFoundException,
    PackstationNummerExistsException,
    VersionInvalidException,
    VersionOutdatedException,
} from './exception.js';
import { Adresse } from '../entity/adresse.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service.js';
import { Packstation } from '../entity/packstation.entity.js';
import { PackstationReadService } from './packstation-read.service.js';
import { Paket } from '../entity/paket.entity.js';
import { getLogger } from '../../logger/logger.js';

export interface UpdateParams {
    readonly id: number | undefined;
    readonly packstation: Packstation;
    readonly version: string;
}

@Injectable()
export class PackstationWriteService {
    private static readonly VERSION_PATTERN = /^"\d{1,3}"/u;

    readonly #repo: Repository<Packstation>;
    readonly #readService: PackstationReadService;
    readonly #mailService: MailService;
    readonly #logger = getLogger(PackstationWriteService.name);

    constructor(
        @InjectRepository(Packstation)
        repo: Repository<Packstation>,
        readService: PackstationReadService,
        mailService: MailService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
        this.#mailService = mailService;
    }

    /**
     * Erstellt eine neue Packstation.
     * @param packstation Die Packstation, die erstellt werden soll.
     * @returns Die erstellte Packstation.
     */
    async create(packstation: Packstation): Promise<number> {
        this.#logger.debug('create: packstation=%o', packstation);
        await this.#validateCreate(packstation);

        const packstationDb = await this.#repo.save(packstation);
        this.#logger.debug('create: packstationDb=%o', packstationDb);

        await this.#sendmail(packstationDb);

        return packstationDb.id!;
    }

    /**
     * Aktualisiert eine Packstation.
     * @param params Die Parameter für die Aktualisierung.
     * @returns Die aktualisierte Packstation.
     */
    async update({ id, packstation, version }: UpdateParams): Promise<number> {
        this.#logger.debug(
            'update: id=%d, packstation=%o, version=%s',
            id,
            packstation,
            version,
        );
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            throw new PackstationNotFoundException(id);
        }

        const validateResult = await this.#validateUpdate(
            packstation,
            id,
            version,
        );
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Packstation)) {
            return validateResult;
        }

        const packstationNeu: Packstation = validateResult;
        const merged: Packstation = this.#repo.merge(
            packstationNeu,
            packstation,
        );
        this.#logger.debug('update: merged=%o', merged);
        const updated: Packstation = await this.#repo.save(merged);
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!;
    }

    /**
     * Loescht eine Packstation.
     * @param id Die ID der Packstation, die geloescht werden soll.
     */
    async delete(id: number): Promise<boolean> {
        this.#logger.debug('delete: id=%d', id);
        const packstation = await this.#readService.findById({
            id,
            mitPaketen: true,
        });

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            // Adresse löschen
            const adresseId = packstation.adresse?.id;
            if (adresseId !== undefined) {
                await transactionalMgr.delete(Adresse, adresseId);
            }

            // Pakete löschen
            const pakete = packstation.pakete ?? [];
            for (const paket of pakete) {
                await transactionalMgr.delete(Paket, paket.id);
            }

            // Packstation löschen
            deleteResult = await transactionalMgr.delete(Packstation, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }

    async #validateCreate({ nummer }: Packstation): Promise<undefined> {
        this.#logger.debug('#validateCreate: nummer=%s', nummer);
        if (await this.#repo.existsBy({ nummer })) {
            throw new PackstationNummerExistsException(nummer);
        }
    }

    async #sendmail(packstation: Packstation) {
        const subject = `Neue Packstation ${packstation.id}`;
        const { nummer } = packstation;
        const body = `Die Packstation mit der Nummer <strong>${nummer}</strong> ist angelegt worden.`;
        await this.#mailService.sendmail({ subject, body });
    }

    async #validateUpdate(
        packstation: Packstation,
        id: number,
        versionStr: string,
    ): Promise<Packstation> {
        this.#logger.debug(
            '#validateUpdate: packstation=%o, id=%d, versionStr=%s',
            packstation,
            id,
            versionStr,
        );
        if (!PackstationWriteService.VERSION_PATTERN.test(versionStr)) {
            throw new VersionInvalidException(versionStr);
        }

        const version = Number.parseInt(versionStr.slice(1, -1), 10);
        this.#logger.debug(
            '#validateUpdate: packstation=%o, version=%d',
            packstation,
            version,
        );

        const packstationDb = await this.#readService.findById({ id });

        const versionDb = packstationDb.version!;
        if (version < versionDb) {
            this.#logger.debug('#validateUpdate: versionDb=%d', versionDb);
            throw new VersionOutdatedException(version);
        }
        this.#logger.debug(
            '#validateUpdatePackstation: packstationDb=%o',
            packstationDb,
        );
        return packstationDb;
    }
}
