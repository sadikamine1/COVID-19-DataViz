# Planning CSVs for GitHub Projects

This folder contains import-ready CSVs to bootstrap the organization Project at:

- https://github.com/orgs/EpitechPGE3-2025/projects

## Files

- github-project-plan-dated.csv
  - With Status (Todo/Done), ISO Start/End, and dependencies text.
- github-project-plan-dated-with-descriptions.csv
  - Same as above + a Description column with ready-to-copy task details.
- github-project-plan.csv (legacy)
  - Uses relative windows (J-4/J+1). Keep for reference.

## Import steps

1. Create a new Project (Table layout) under the org.
2. In the project, open the top-right menu (···) → Import items → CSV.
3. Upload one of the CSV files from this folder.
4. Field mapping recommendations:
   - Title → Title
   - Status → Status (create a single-select if missing; values: Todo, Done)
   - Priority → Single-select (P1, P2) or Text
   - Milestone → Single-select (M1–M4)
   - Labels → Labels
   - Depends on → Text
   - Start → Date (Start date)
   - End → Date (Target date)
   - State → Text (optional legacy)
   - Description → Text (only in the “with-descriptions” CSV)

## Notes

- Times are ISO without timezone; GitHub renders dates based on your profile timezone.
- Weekends are included in the schedule; shift after import if needed.
- Dependencies are informational strings; you can replace with links to items for cross-references.
- For a Timeline view: ensure Start and End are mapped as Date fields.
