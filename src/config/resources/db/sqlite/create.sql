-- https://sqlite.org/lang_createtable.html
-- https://sqlite.org/stricttables.html ab 3.37.0
-- https://sqlite.org/syntax/column-constraint.html
-- https://sqlite.org/autoinc.html
-- https://sqlite.org/stricttables.html: INT, INTEGER, REAL, TEXT
-- https://sqlite.org/lang_createindex.html
-- https://stackoverflow.com/questions/37619526/how-can-i-change-the-default-sqlite-timezone

CREATE TABLE IF NOT EXISTS packstation (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    version           INTEGER NOT NULL DEFAULT 0,
    nummer            TEXT NOT NULL UNIQUE,
    baudatum          TEXT,
    ausstattung       TEXT,
    erzeugt           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    aktualisiert      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS packstation_nummer_idx ON packstation(nummer);

CREATE TABLE IF NOT EXISTS adresse (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    strasse           TEXT,
    hausnummer        TEXT,
    postleitzahl      TEXT,
    stadt             TEXT NOT NULL,
    packstation_id    INTEGER NOT NULL UNIQUE REFERENCES packstation(id)
);

CREATE TABLE IF NOT EXISTS paket (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    nummer            TEXT NOT NULL UNIQUE,
    max_gewicht_in_kg DECIMAL(8,2),
    packstation_id    INTEGER NOT NULL REFERENCES packstation(id)
);
CREATE INDEX IF NOT EXISTS pakete_packstation_id_idx ON paket(packstation_id);