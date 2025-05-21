// @eslint-community/eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type GraphQLFormattedError } from 'graphql';
import { type GraphQLRequest } from '@apollo/server';
import { HttpStatus } from '@nestjs/common';
import { type Packstation } from '../../src/packstation/entity/packstation.entity.js';

// eslint-disable-next-line jest/no-export
export interface GraphQLResponseBody {
    data?: Record<string, any> | null;
    errors?: readonly [GraphQLFormattedError];
}

type PackstationDTO = Omit<
    Packstation,
    'pakete' | 'aktualisiert' | 'erzeugt'
> & {
    nummer: string;
};

// ------------------------ T e s t d a t e n ------------------------
const idVorhanden = '1';

const stadtVorhanden = 'Mannheim';
const teilStadtVorhanden = 'ann';
const teilStadtNichtVorhanden = 'abc';

const nummerVorhanden = '123';

// ------------------------ T e s t s --------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Queries', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
            // auch Statuscode 400 als gueltigen Request akzeptieren, wenn z.B.
            // ein Enum mit einem falschen String getestest wird
            validateStatus: () => true,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Packstation zu vorhandener ID', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    packstation(id: "${idVorhanden}") {
                        version
                        nummer
                        baudatum
                        ausstattung
                        adresse {
                            stadt
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu); // eslint-disable-line sonarjs/no-duplicate-string
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { packstation } = data.data!;
        const result: PackstationDTO = packstation;

        expect(result.adresse?.stadt).toMatch(/^\w/u);
        expect(result.version).toBeGreaterThan(-1);
        expect(result.id).toBeUndefined();
    });

    test('Packstation zu nicht-vorhandener ID', async () => {
        // given
        const id = '999999';
        const body: GraphQLRequest = {
            query: `
                {
                    packstation(id: "${id}") {
                        adresse {
                            stadt
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.packstation).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toBe(`Es gibt keine Packstation mit der ID ${id}.`);
        expect(path).toBeDefined();
        expect(path![0]).toBe('packstation');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test('Packstation zu vorhandener Stadt', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    packstationen(suchkriterien: {
                        stadt: "${stadtVorhanden}"
                    }) {
                        nummer
                        adresse {
                            stadt
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        expect(data.data).toBeDefined();

        const { packstationen } = data.data!;

        expect(packstationen).not.toHaveLength(0);

        const packstationenArray: PackstationDTO[] = packstationen;

        expect(packstationenArray).toHaveLength(1);

        const [packstation] = packstationenArray;

        expect(packstation!.adresse?.stadt).toBe(stadtVorhanden);
    });

    test('Packstation zu vorhandener Teil-Stadt', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    packstationen(suchkriterien: {
                        stadt: "${teilStadtVorhanden}"
                    }) {
                        adresse {
                            stadt
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { packstationen } = data.data!;

        expect(packstationen).not.toHaveLength(0);

        const packstationenArray: PackstationDTO[] = packstationen;
        packstationenArray
            .map((packstation) => packstation.adresse)
            .forEach((adresse) =>
                expect(adresse?.stadt.toLowerCase()).toEqual(
                    expect.stringContaining(teilStadtVorhanden),
                ),
            );
    });

    test('Packstation zu nicht vorhandener Stadt', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    packstationen(suchkriterien: {
                        stadt: "${teilStadtNichtVorhanden}"
                    }) {
                        nummer
                        adresse {
                            stadt
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.packstationen).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toMatch(/^Keine Packstationen gefunden:/u);
        expect(path).toBeDefined();
        expect(path![0]).toBe('packstationen');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test('Packstation zu vorhandener Nummer', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    packstationen(suchkriterien: {
                        nummer: "${nummerVorhanden}"
                    }) {
                        nummer
                        adresse {
                            stadt
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        expect(data.data).toBeDefined();

        const { packstationen } = data.data!;

        expect(packstationen).not.toHaveLength(0);

        const packstationenArray: PackstationDTO[] = packstationen;

        expect(packstationenArray).toHaveLength(1);

        const [packstation] = packstationenArray;
        const { nummer, adresse } = packstation!;

        expect(nummer).toBe(nummerVorhanden);
        expect(adresse?.stadt).toBeDefined();
    });
});

/* eslint-enable @typescript-eslint/no-unsafe-assignment */
/* eslint-enable max-lines */
