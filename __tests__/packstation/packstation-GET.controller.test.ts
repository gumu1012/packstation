// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable no-underscore-dangle */

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
import { type PackstationenModel } from '../../src/packstation/rest/packstation-get.controller.js';

// ------------------------ T e s t d a t e n ------------------------
const stadtVorhanden = 'a';
const stadtNichtVorhanden = 'xx';
const ausstattungVorhanden = 'bildschirm';

// ------------------------ T e s t s --------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GET /rest', () => {
    let baseURL: string;
    let client: AxiosInstance;

    beforeAll(async () => {
        await startServer();
        baseURL = `https://${host}:${port}/rest`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Alle Packstationen', async () => {
        // given

        // when
        const { status, headers, data }: AxiosResponse<PackstationenModel> =
            await client.get('/');

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { packstationen } = data._embedded;

        packstationen
            .map((packstation) => packstation._links.self.href)
            .forEach((selfLink) => {
                // eslint-disable-next-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr
                expect(selfLink).toMatch(new RegExp(`^${baseURL}`, 'iu'));
            });
    });

    test('Packstationen mit einer Teil-Adresse suchen', async () => {
        // given
        const params = { stadt: stadtVorhanden };

        // when
        const { status, headers, data }: AxiosResponse<PackstationenModel> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { packstationen } = data._embedded;

        // Jede Packstation hat eine Stadt mit dem Teilstring 'arl'
        packstationen
            .map((packstation) => packstation.adresse)
            .forEach((adresse) =>
                expect(adresse.stadt.toLowerCase()).toEqual(
                    expect.stringContaining(stadtVorhanden),
                ),
            );
    });

    test('Packstationen zu einer nicht vorhandenen Teil-Adresse suchen', async () => {
        // given
        const params = { stadt: stadtNichtVorhanden };

        // when
        const { status, data }: AxiosResponse<ErrorResponse> = await client.get(
            '/',
            { params },
        );

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);

        const { error, statusCode } = data;

        expect(error).toBe('Not Found');
        expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    test('Mindestens eine Packstation mit vorhandener Ausstattung', async () => {
        // given
        const params = { [ausstattungVorhanden]: 'true' };

        // when
        const { status, headers, data }: AxiosResponse<PackstationenModel> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        // JSON-Array mit mind. 1 JSON-Objekt
        expect(data).toBeDefined();

        const { packstationen } = data._embedded;

        packstationen
            .map((packstation) => packstation.ausstattung)
            .forEach((ausstattung) =>
                expect(ausstattung).toEqual(
                    expect.arrayContaining([
                        ausstattungVorhanden.toUpperCase(),
                    ]),
                ),
            );
    });

    test('Keine Packstationen zu einer nicht-vorhandenen Property', async () => {
        // given
        const params = { foo: 'bar' };

        // when
        const { status, data }: AxiosResponse<ErrorResponse> = await client.get(
            '/',
            { params },
        );

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);

        const { error, statusCode } = data;

        expect(error).toBe('Not Found');
        expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });
});
/* eslint-enable no-underscore-dangle */
