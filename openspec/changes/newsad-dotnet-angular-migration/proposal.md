# Proposal: Full NewSAD Migration to SADAlumnos Architecture

## Intent

Replace the current Astro portal shell with a SADAlumnos-style solution so NewSAD gains a layered .NET backend, Angular frontend, and local-db authorization. This solves the gap between the current static shell and the required authenticated application model.

## Scope

### In Scope
- Rebuild NewSAD as `Domain`/`Application`/`Infrastructure`/`WebApi` plus Angular `WebUI`.
- Implement Keycloak authentication with local authorization from the SADAdministracion model.
- Port the current shell behavior that still matters: authenticated layout, navigation intent, Power BI embeds, and branding.
- Define the first slice as login, session bootstrap, main shell, and authenticated Power BI visibility.

### Out of Scope
- Hybrid Astro + Angular transition code.
- New business modules beyond portal, auth, and report access.
- Redesign of the shared authorization schema beyond NewSAD-specific access/permission entries.

## Capabilities

### New Capabilities
- `newsad-auth-session`: Keycloak sign-in, cookie session, local user authorization, and user-info bootstrap.
- `newsad-portal-shell`: Angular shell, guarded routes, navigation, and shared layout.
- `newsad-report-access`: Authenticated access to Power BI views for any locally authorized user.

### Modified Capabilities
- None.

## Approach

Use full replacement, not incremental migration. Start from the SADAlumnos backend/frontend structure, adapt auth to NewSAD rules, then port portal UX/report behavior. Keep Astro only as rollback baseline until the new stack passes end-to-end auth and report smoke checks.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/**`, `src/components/**`, `src/layouts/**` | Removed | Astro shell retired after cutover |
| `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web/WebApi` | New | Layered backend aligned with SADAlumnos |
| `src/Web/WebUI` | New | Angular SPA shell and report UI |
| `openspec/changes/newsad-dotnet-angular-migration/*` | Modified | Migration planning artifacts |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing hidden business rules | Med | Lock first slice, confirm unknowns in spec/design |
| Auth blocked by missing local users/permissions | High | Seed/verify NewSAD access entries early |
| Review size exceeds budget | High | Plan chained PR slices from tasks phase |

## Rollback Plan

Do not replace production Astro deployment until the new .NET + Angular slice is verified. Roll back by keeping cutover on the feature branch and continuing to serve the current Astro build.

## Dependencies

- SADAlumnos reference architecture and auth flow
- Keycloak client/config for NewSAD
- SADAdministracion local user/role/permission data

## Success Criteria

- [ ] Any user present and active in the local authorization DB can sign in to NewSAD.
- [ ] Any authenticated user can reach the main shell and see Power BI content.
- [ ] Astro runtime/tooling is no longer required for the migrated application.

## Proposal Question Round

- Assumption to confirm in spec/design: first slice ships one authenticated dashboard shell before any extra feature expansion.
- Open product check: are all current external module links kept as-is in slice one, or can some move to a later slice?
