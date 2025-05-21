import { KeycloakModule } from '../security/keycloak/keycloak.module.js';
import { MailModule } from '../mail/mail.module.js';
import { Module } from '@nestjs/common';
import { PackstationGetController } from './rest/packstation-get.controller.js';
import { PackstationMutationResolver } from './graphql/packstation-mutation.resolver.js';
import { PackstationQueryResolver } from './graphql/packstation-query.resolver.js';
import { PackstationReadService } from './service/packstation-read.service.js';
import { PackstationWriteController } from './rest/packstation-write.controller.js';
import { PackstationWriteService } from './service/packstation-write.service.js';
import { QueryBuilder } from './service/query-builder.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './entity/entities.js';

/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung von
 * Packstationen.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für TypeORM.
 */
@Module({
    imports: [KeycloakModule, MailModule, TypeOrmModule.forFeature(entities)],
    controllers: [PackstationGetController, PackstationWriteController],
    // Provider sind z.B. Service-Klassen fuer DI
    providers: [
        PackstationReadService,
        PackstationWriteService,
        PackstationQueryResolver,
        PackstationMutationResolver,
        QueryBuilder,
    ],
    // Export der Provider fuer DI in anderen Modulen
    exports: [PackstationReadService, PackstationWriteService],
})
export class PackstationModule {}
