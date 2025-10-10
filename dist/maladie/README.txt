Diseases CSVs live here so the app can fetch them at runtime.

REQUIRED SCHEMA (French monthly format):
Header (exact):
	Année,Mois,Cas déclarés,Hospitalisations,Décès,Pays

Rows:
	- Année: YYYY (e.g., 2020)
	- Mois: 1..12
	- Cas déclarés: integer (monthly cases for this country)
	- Hospitalisations: integer (monthly hospitalizations)
	- Décès: integer (monthly deaths)
	- Pays: country name in French (e.g., France, Espagne, Italie, Allemagne)

Notes:
	- The app aggregates rows by month to build the global time series.
	- The map and Top countries use the latest month found in the file.
	- Country names are mapped to centroids (FR→EN) for placement.

DEV SYNC WARNING:
	If a repository root folder named "maladie" exists, the dev/build script
	will copy CSVs from ./maladie/*.csv into ./public/maladie/ (overwriting files).
	Make sure the root ./maladie CSVs follow the same schema as above, or remove
	that folder if you want to edit files only in ./public/maladie/.
