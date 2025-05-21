-- https://www.sqlite.org/lang_dropindex.html
DROP INDEX IF EXISTS pakete_packstation_id_idx; 
DROP INDEX IF EXISTS packstation_nummer_idx;

-- https://www.sqlite.org/lang_droptable.html
DROP TABLE IF EXISTS paket;
DROP TABLE IF EXISTS adresse;
DROP TABLE IF EXISTS packstation;
