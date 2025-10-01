# Plan de projet (GitHub Project) – COVID‑19 DataViz

Période : 8 jours (4 jours passés + 4 jours à venir)

- Cadre: GitHub Projects (table/board), issues & milestones
- Détails: créneaux horaires, estimations, dépendances, état

## Légendes
- Etat: Done / In progress / To do / Blocked
- Priorité: P0 (critique), P1 (haute), P2 (normale)
- Durée: estimation en heures effectives
- Labels proposés: `frontend`, `data`, `map`, `infra`, `design`, `docs`, `tests`, `nice-to-have`
- Milestones: M1 (MVP), M2 (Map+UX), M3 (Extensions maladies), M4 (Release)


## Timeline synthétique

- J-4: Parsing CSV robuste + Totaux globaux (M1) – Done
- J-3: Séries temporelles + Table pays (M1) – Done
- J-2: Carte (points proportionnels) + style dark (M2) – Done
- J-1: Filtre année + Correctif "Recovered" (M2) – Done
- J+1: Fix placement cercles + légende + métrique dynamique (M2) – To do
- J+2: Déploiement (GitHub Pages/Vercel) + cache local (M3) – To do
- J+3: Ajout maladies additionnelles (Grippe saisonnière, SRAS historique) (M3) – To do
- J+4: Tests, perf, doc finale, release note (M4) – To do


## Backlog détaillé (issues suggérées)

### J-4 (passé) – M1 – Done
1. [P1][data] Normaliser parsing CSV (BOM, CRLF, délimiteurs) – 4h – Done
2. [P1][data] Détection HTML vs CSV (fallback) – 2h – Done
3. [P1][data] Séries globales Confirmed/Deaths/Recovered – 3h – Done

### J-3 (passé) – M1 – Done
4. [P1][frontend] Intégration Chart.js + date-fns – 3h – Done
5. [P1][frontend] Tableau top pays + recherche – 4h – Done
6. [P2][design] Style dashboard sobre (cartes métriques) – 2h – Done

### J-2 (passé) – M2 – Done
7. [P1][map] Carte Leaflet + cercles proportionnels – 5h – Done
8. [P2][map] Basemap sombre + tooltip – 2h – Done
9. [P2][design] Alignements, padding, responsivité – 2h – Done

### J-1 (passé) – M2 – Done
10. [P1][data] Correctif "Recovered" (dernière date non nulle) – 3h – Done
11. [P1][frontend] Filtre par année (séries + totaux) – 4h – Done

### J+1 (à venir) – M2 – To do
12. [P1][map] Affiner placement/échelle des cercles (piecewise + clipping villes côtières) – 4h – To do
13. [P1][map] Légende des tailles + toggle lin/log – 3h – To do
14. [P1][frontend] Switch métrique unifié (carte + graph + tableau) – 3h – To do

### J+2 (à venir) – M3 – To do
15. [P1][infra] Déploiement GitHub Pages (ou Vercel) – 2h – To do
16. [P2][data] Cache local (IndexedDB) + versioning dataset – 4h – To do
17. [P2][perf] Code splitting (Chart.js/Leaflet) – 3h – To do

### J+3 (à venir) – M3 – To do
18. [P1][data] Ajout “Grippe saisonnière” (source OMS, CSV) – 5h – To do
19. [P1][data] Ajout SRAS (2003) – 3h – To do
20. [P2][frontend] Sélecteur multi-maladies + couleurs – 4h – To do

### J+4 (à venir) – M4 – To do
21. [P1][tests] Tests parsing + agrégations (unitaires) – 3h – To do
22. [P1][docs] README complet + guide déploiement + limites données – 3h – To do
23. [P2][perf] Audit bundle + optimisations – 2h – To do
24. [P1][release] Tag v1.0 + changelog + release note – 2h – To do


## Dépendances
- #12 dépend de #7 (carte en place)
- #13 dépend de #12 (échelle stabilisée)
- #14 dépend de #4 et #7 (graph + carte prêts)
- #15 dépend d’un build stable (#14)
- #18/#19 dépendent d’un schéma données stable (#1-#3)

## Milestones
- M1 – MVP (J-4/J-3)
- M2 – Map+UX (J-2/J-1/J+1)
- M3 – Extensions maladies + déploiement (J+2/J+3)
- M4 – Release (J+4)


## Import dans GitHub Projects (astuce)
- Crée un “Project (beta)” → vue Table.
- Crée les colonnes custom: Etat, Priorité, Durée (h), Milestone, Dépendances.
- Saisis les issues ci‑dessus ou importe via CSV (voir fichier plan-csv plus bas).
