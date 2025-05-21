import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type ErrorResponse } from './error-response.js';
import { HttpStatus } from '@nestjs/common';
import { type PackstationDTO } from '../../src/packstation/rest/packstationDTO.entity.js';
import { PackstationReadService } from '../../src/packstation/service/packstation-read.service.js';
import { loginRest } from '../login.js';

// ------------------------ T e s t d a t e n ------------------------
const neuePackstation: PackstationDTO = {
    nummer: '565',
    baudatum: '2022-01-31',
    ausstattung: ['BILDSCHIRM', 'BLUETOOTH'],
    adresse: {
        strasse: 'Moltkestr.',
        hausnummer: '54',
        stadt: 'Karlsruhe',
        postleitzahl: '76133',
    },
    pakete: [
        {
            nummer: '239087423504',
            maxGewichtInKg: 5,
        },
    ],
};
const neuePackstationInvalid: Record<string, unknown> = {
    nummer: 'falsch',
    baudatum: '12345-123-123',
    adresse: {
        strasse: '*2^+°§',
        hausnummer: '234§$',
        postleitzahl: 'FEHLER',
        stadt: '092343',
    },
};
const neuePackstationNummerExistiert: PackstationDTO = {
    nummer: '123',
    baudatum: '2022-02-28',
    ausstattung: ['BILDSCHIRM', 'BLUETOOTH'],
    adresse: {
        strasse: 'Musterstraße',
        hausnummer: '16A',
        postleitzahl: '76133',
        stadt: 'Karlsruhe',
    },
    pakete: undefined,
};

// ------------------------ T e s t s --------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('POST /rest', () => {
    let client: AxiosInstance;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json', // eslint-disable-line @typescript-eslint/naming-convention
    };

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Neue Packstation', async () => {
        // given
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<string> = await client.post(
            '/rest',
            neuePackstation,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.CREATED);

        const { location } = response.headers as { location: string };

        expect(location).toBeDefined();

        // ID nach dem letzten "/"
        const indexLastSlash: number = location.lastIndexOf('/');

        expect(indexLastSlash).not.toBe(-1);

        const idStr = location.slice(indexLastSlash + 1);

        expect(idStr).toBeDefined();
        expect(PackstationReadService.ID_PATTERN.test(idStr)).toBe(true);

        expect(data).toBe('');
    });

    test('Neue Packstation mit ungueltigen Daten', async () => {
        // given
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        const expectedMsg = [
            expect.stringMatching(/^baudatum /u),
            expect.stringMatching(/^adresse.strasse /u),
            expect.stringMatching(/^adresse.postleitzahl /u),
        ];

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '/rest',
            neuePackstationInvalid,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const messages: string[] = data.message;

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toEqual(expect.arrayContaining(expectedMsg));
    });

    test('Neue Packstation, aber die Nummer existiert bereits', async () => {
        // given
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<ErrorResponse> = await client.post(
            '/rest',
            neuePackstationNummerExistiert,
            { headers },
        );

        // then
        const { data } = response;

        const { message, statusCode } = data;

        expect(message).toEqual(expect.stringContaining('Packstationsnummer'));
        expect(statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    test('Neue Packstation, aber ohne Token', async () => {
        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '/rest',
            neuePackstation,
        );

        // then
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    test('Neue Packstation, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '/rest',
            neuePackstation,
            { headers },
        );

        // then
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
});
