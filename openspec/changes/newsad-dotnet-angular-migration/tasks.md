# Tasks: Full NewSAD Migration to SADAlumnos Architecture

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1800-2600 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 -> PR 2 -> PR 3 -> PR 4 |
| Delivery strategy | ask-always |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Scaffold .NET + Angular solution and config contracts | PR 1 | Keep Astro running; no cutover |
| 2 | Add backend auth/session/bootstrap APIs | PR 2 | Depends on PR 1 |
| 3 | Add Angular shell, guards, links, and reports | PR 3 | Depends on PR 2 |
| 4 | Cut over hosting, verify parity, remove Astro | PR 4 | Depends on PR 3 |

## Phase 1: Foundation / Auth Data

- [x] 1.1 Create `NewSAD.slnx`, `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web/WebApi`, and `src/Web/WebUI` from SADAlumnos layout without deleting Astro yet.
- [x] 1.2 Add portal config contracts in `src/Domain/Common` and `src/Application/Common/Models`, plus `src/Web/WebApi/appsettings*.json` entries for links, reports, and theme storage.
- [x] 1.3 Wire SADAdministracion access in `src/Application/Common/Interfaces` and `src/Infrastructure/**` so NewSAD can resolve active users, roles, and permissions from the same local DB model.

## Phase 2: Backend / Session Bootstrap

- [x] 2.1 Implement `src/Application/Auth/Commands/UserLogin/*` and `SessionAuthorizationSnapshot` so any active local user can enter slice one, while inactive/missing users are denied.
- [x] 2.2 Implement `src/Web/WebApi/Services/SessionPrincipalFactory.cs` and `ConfigureServices.cs` for OIDC, cookie auth, return-url checks, and periodic local revalidation.
- [x] 2.3 Add `src/Web/WebApi/Endpoints/Auth/AuthEndpoints.cs` and `Endpoints/Portal/PortalEndpoints.cs` for login, logout, `user-info`, and bootstrap payload with preserved links and report metadata.

## Phase 3: Frontend / Shell and Reports

- [x] 3.1 Scaffold Angular app files in `src/Web/WebUI/src/app` (`app.ts`, `app.config.ts`, `routes.ts`) with auth guard, session store, and protected shell routing.
- [x] 3.2 Port `src/components/Header.astro` and `Footer.astro` into `src/Web/WebUI/src/app/core/layout/**`, preserving branding, theme toggle, footer, and every current external portal link.
- [x] 3.3 Build `src/Web/WebUI/src/app/features/portal/**` and `features/reports/**` to consume `/api/portal/bootstrap`, render both Power BI views, and show a recoverable unavailable state.

## Phase 4: Integration / Verification / Cutover

- [x] 4.1 Wire `src/Web/WebApi/Program.cs` and WebUI hosting/proxy files so unauthenticated requests redirect, authenticated users load the Angular shell, and static SPA fallback works.
- [x] 4.2 Add backend tests under `tests/Application/**` and `tests/WebApi/**` for authorized login, denied inactive user, protected endpoint redirect, bootstrap parity, and report metadata mapping.
- [x] 4.3 Add frontend smoke coverage when toolchain exists, then delete `src/pages/**`, `src/components/**`, `src/layouts/**`, and `src/styles/**` only after parity checks pass.
