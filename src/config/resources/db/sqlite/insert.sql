-- Einfügen der Daten in die Tabelle 'packstation'
INSERT INTO packstation (id, version, nummer, baudatum, ausstattung, erzeugt, aktualisiert) VALUES
(1, 0, '143', '2016-01-01 00:00:00', 'BILDSCHIRM', '2016-01-01 00:00:00', '2016-01-01 00:00:00');
INSERT INTO packstation (id, version, nummer, baudatum, ausstattung, erzeugt, aktualisiert) VALUES
(2, 0, '123', '2016-01-01 00:00:00', 'BILDSCHIRM', '2016-01-01 00:00:00', '2016-01-01 00:00:00');
INSERT INTO packstation (id, version, nummer, baudatum, ausstattung, erzeugt, aktualisiert) VALUES
(3, 0, '43', '2016-01-01 00:00:00', 'BILDSCHIRM,BLUETOOTH', '2016-01-01 00:00:00', '2016-01-01 00:00:00');
INSERT INTO packstation (id, version, nummer, baudatum, ausstattung, erzeugt, aktualisiert) VALUES
(4, 0, '239', '2017-01-01 00:00:00', null, '2017-01-01 00:00:00', '2017-01-01 00:00:00');
INSERT INTO packstation (id, version, nummer, baudatum, ausstattung, erzeugt, aktualisiert) VALUES
(5, 0, '566', '2022-01-01 00:00:00', 'BLUETOOTH', '2022-01-01 00:00:00', '2022-01-01 00:00:00');
INSERT INTO packstation (id, version, nummer, baudatum, ausstattung, erzeugt, aktualisiert) VALUES
(6, 0, '324', '2023-01-01 00:00:00', 'BILDSCHIRM', '2023-01-01 00:00:00', '2023-01-01 00:00:00');

-- Einfügen der Daten in die Tabelle 'adresse'
INSERT INTO adresse (id, strasse, hausnummer, postleitzahl, stadt, packstation_id) VALUES
(1, 'Kriegsstraße', '23', '76133', 'Karlsruhe', 1);
INSERT INTO adresse (id, strasse, hausnummer, postleitzahl, stadt, packstation_id) VALUES
(30, 'Kaiserstraße', '12', '76131', 'Karlsruhe', 2);
INSERT INTO adresse (id, strasse, hausnummer, postleitzahl, stadt, packstation_id) VALUES
(40, 'Moltkestraße', '56', '76133', 'Karlsruhe', 3);
INSERT INTO adresse (id, strasse, hausnummer, postleitzahl, stadt, packstation_id) VALUES
(50, 'Kaiser-Josef-Straße', '34', '79098', 'Freiburg', 4);
INSERT INTO adresse (id, strasse, hausnummer, postleitzahl, stadt, packstation_id) VALUES
(60, 'Schnewelinstraße', '12', '79115', 'Freiburg', 5);
INSERT INTO adresse (id, strasse, hausnummer, postleitzahl, stadt, packstation_id) VALUES
(70, 'Blumenstraße', '7', '68199', 'Mannheim', 6);

-- Einfügen der Daten in die Tabelle 'paket'
INSERT INTO paket (id, nummer, max_gewicht_in_kg, packstation_id) VALUES
(340, '00340434519210455953', 5.00, 1);
INSERT INTO paket (id, nummer, max_gewicht_in_kg, packstation_id) VALUES
(346, '00340434192104235432', 10.00, 1);
INSERT INTO paket (id, nummer, max_gewicht_in_kg, packstation_id) VALUES
(124, '00340434565466595433', 2.00, 1);
INSERT INTO paket (id, nummer, max_gewicht_in_kg, packstation_id) VALUES
(840, '00340434843720504885', 5.00, 2);
INSERT INTO paket (id, nummer, max_gewicht_in_kg, packstation_id) VALUES
(016, '00340434478159814584', 10.00, 2);
INSERT INTO paket (id, nummer, max_gewicht_in_kg, packstation_id) VALUES
(434, '00340434134567547454', 2.00, 3);
INSERT INTO paket (id, nummer, max_gewicht_in_kg, packstation_id) VALUES
(760, '00340434151543545434', 5.00, 4);
INSERT INTO paket (id, nummer, max_gewicht_in_kg, packstation_id) VALUES
(908, '00340434798341657945', 10.00, 5);
INSERT INTO paket (id, nummer, max_gewicht_in_kg, packstation_id) VALUES
(637, '00340434346356547856', 2.00, 5);
