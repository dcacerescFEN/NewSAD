## Exploration: Full migration of NewSAD to SADAlumnos-style .NET + Angular architecture

### Current State
NewSAD is currently a very small Astro 6 portal shell: one page (`src/pages/index.astro`) rendered through a shared layout with a Bootstrap header, footer, theme toggle, external module links, and two Power BI iframes. There is no backend, no API surface, no local authorization model, and no test harness in the checked repo state. SADAlumnos uses a very different target shape: layered .NET (`Domain` → `Application` → `Infrastructure` → `WebApi`), standalone Angular in `src/Web/WebUI`, minimal API endpoint auto-discovery, cookie session auth backed by Keycloak OIDC, local authorization loaded from `SADAdministracion`, XSRF protection, and runtime dependence on SQL-backed configuration. Practically, the migration should keep product intent and UX assets that still matter (branding, navigation intent, report/embed destinations, theme behavior), replace the Astro implementation and delivery pipeline, and remove the static-shell-only assumption.

### Affected Areas
- `NewSAD/src/pages/index.astro` — current app entry point; replaced by Angular route structure.
- `NewSAD/src/layouts/Layout.astro` — current shell composition; replaced by Angular app layout.
- `NewSAD/src/components/Header.astro` — current navigation model and external module links; source input for Angular header/navigation requirements.
- `NewSAD/src/components/Report.astro` — current Power BI/report behavior; survives functionally but needs Angular feature ownership.
- `NewSAD/package.json` — Astro-only toolchain; replaced by SADAlumnos-style split backend/frontend toolchain.
- `SADAlumnos/src/Web/WebApi/Program.cs` — reference startup pattern for minimal APIs, antiforgery, auth middleware, and SPA fallback.
- `SADAlumnos/src/Web/WebApi/ConfigureServices.cs` — reference auth/runtime contract: cookie auth, Keycloak OIDC, session revalidation, and login/logout behavior.
- `SADAlumnos/src/Application/Auth/Commands/UserLogin/UserLogin.cs` — reference local DB authorization flow after external authentication.
- `SADAlumnos/src/Infrastructure/Data/SADAdministracionContext.cs` — reference authorization schema integration (`Users`, `Roles`, `Permissions`).
- `SADAlumnos/src/Web/WebUI/src/app/app.routes.ts` — reference Angular route shell and auth-guarded navigation.
- `SADAlumnos/src/Web/WebUI/src/app/features/auth/services/auth-store.ts` — reference frontend session bootstrap and permission-aware auth state.

### Approaches
1. **Full skeleton replacement** — Rebuild NewSAD directly on the SADAlumnos architecture, then port only the functional/UI assets that still matter from Astro.
   - Pros: matches the stated target exactly, gives clean backend/frontend boundaries, avoids keeping throwaway Astro code, aligns later proposal/spec/design work with the real end-state.
   - Cons: requires defining NewSAD-specific permissions/endpoints early, adds immediate runtime complexity (.NET, Angular, SQL-backed config, Keycloak), and likely needs chained delivery slices.
   - Effort: High

2. **Hybrid transition shell** — Keep Astro temporarily while introducing the .NET backend and progressively moving UI into Angular.
   - Pros: can preserve current UI quickly and may reduce first visible disruption.
   - Cons: violates the target architecture, duplicates routing/auth/runtime concerns, creates migration-only glue code, and increases rollback/deployment complexity.
   - Effort: High

### Recommendation
Use **Full skeleton replacement**. The current NewSAD repo is too small and too UI-only to justify a hybrid bridge. Backend responsibilities should move into the new .NET layers: Keycloak authentication handshake, local authorization lookup from the SADAdministracion model, application use cases, configuration loading, and any future NewSAD domain APIs. Frontend responsibilities should move into Angular: authenticated shell, navigation, report/dashboard presentation, permission-aware routing, and API consumption. Auth/data integration should follow the SADAlumnos pattern exactly: Keycloak proves identity, `UserLogin`-style application logic resolves the local user/roles/permissions, cookie session becomes the browser auth boundary, and Angular bootstraps from `/api/auth/user-info`. Deployment/runtime also must shift from static Astro hosting to a combined .NET API + Angular SPA setup with SQL Server and Keycloak dependencies. In scope: port branding/navigation/report behavior, create the SADAlumnos-style solution structure, and define NewSAD-specific local permissions. Out of scope for survival: Astro pages/components/layouts, inline DOM scripts, and the current root-only frontend runtime.

### Risks
- NewSAD current repo contains almost no business logic, so hidden requirements may live outside the codebase and must be recovered before spec/design.
- Authorization depends on both Keycloak and the local SADAdministracion model; missing NewSAD users/roles/permission slugs will block real access even if OIDC works.
- SADAlumnos startup depends on SQL-backed configuration and multiple DB contexts; adopting that runtime model increases environment/setup fragility.
- The migration is bigger than the 400-line review budget, so proposal/tasks should plan chained PR slices from the start.

### Ready for Proposal
Yes — the proposal should frame this as a full replacement migration, explicitly lock what survives (branding, links intent, report behavior), what is rebuilt (backend, frontend, auth/session flow), what is removed (Astro runtime/tooling), and the migration order for auth, shell, data/report features, and deployment.
