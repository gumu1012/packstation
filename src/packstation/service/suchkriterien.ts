/**
 * Das Modul besteht aus der Klasse {@linkcode PackstationReadService}.
 * @packageDocumentation
 */

export interface Suchkriterien {
    readonly nummer?: string;
    readonly baudatum?: Date;
    readonly bildschirm?: string;
    readonly bluetooth?: string;
    readonly hatPakete?: boolean;
    readonly stadt?: string;
}
