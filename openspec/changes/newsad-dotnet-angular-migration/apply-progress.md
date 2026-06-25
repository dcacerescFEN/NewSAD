# Apply Progress: newsad-dotnet-angular-migration

## Mode

Standard

## Completed Tasks

- [x] 1.1 Create `NewSAD.slnx`, `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web/WebApi`, and `src/Web/WebUI` from SADAlumnos layout without deleting Astro yet.
- [x] 1.2 Add portal config contracts in `src/Domain/Common` and `src/Application/Common/Models`, plus `src/Web/WebApi/appsettings*.json` entries for links, reports, and theme storage.
- [x] 1.3 Wire SADAdministracion access in `src/Application/Common/Interfaces` and `src/Infrastructure/**` so NewSAD can resolve active users, roles, and permissions from the same local DB model.
- [x] 2.1 Implement `src/Application/Auth/Commands/UserLogin/*` and `SessionAuthorizationSnapshot` so any active local user can enter slice one, while inactive/missing users are denied.
- [x] 2.2 Implement `src/Web/WebApi/Services/SessionPrincipalFactory.cs` and `ConfigureServices.cs` for OIDC, cookie auth, return-url checks, and periodic local revalidation.
- [x] 2.3 Add `src/Web/WebApi/Endpoints/Auth/AuthEndpoints.cs` and `Endpoints/Portal/PortalEndpoints.cs` for login, logout, `user-info`, and bootstrap payload with preserved links and report metadata.
- [x] 3.1 Scaffold Angular app files in `src/Web/WebUI/src/app` (`app.ts`, `app.config.ts`, `routes.ts`) with auth guard, session store, and protected shell routing.
- [x] 3.2 Port `src/components/Header.astro` and `Footer.astro` into `src/Web/WebUI/src/app/core/layout/**`, preserving branding, theme toggle, footer, and every current external portal link.
- [x] 3.3 Build `src/Web/WebUI/src/app/features/portal/**` and `features/reports/**` to consume `/api/portal/bootstrap`, render both Power BI views, and show a recoverable unavailable state.
- [x] 4.1 Wire `src/Web/WebApi/Program.cs` and WebUI hosting/proxy files so unauthenticated requests redirect, authenticated users load the Angular shell, and static SPA fallback works.
- [x] 4.2 Add backend tests under `tests/Application/**` and `tests/WebApi/**` for authorized login, denied inactive user, protected endpoint redirect, bootstrap parity, and report metadata mapping.
- [x] 4.3 Add frontend smoke coverage when toolchain exists, then delete `src/pages/**`, `src/components/**`, `src/layouts/**`, and `src/styles/**` only after parity checks pass.

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `NewSAD.slnx` | Created | Added SADAlumnos-like solution root for the new layered projects. |
| `src/Domain/**`, `src/Application/**`, `src/Infrastructure/**` | Created | Added initial .NET layer scaffolding and portal configuration contracts. |
| `src/Web/WebApi/**` | Created | Added minimal API host scaffold and portal configuration files. |
| `src/Web/WebUI/**` | Created | Added standalone Angular workspace skeleton for later shell slices. |
| `openspec/changes/newsad-dotnet-angular-migration/tasks.md` | Updated | Recorded the resolved chain strategy and marked foundation tasks complete. |
| `src/Application/Common/Interfaces/ISadAdministracionAccess.cs` | Created | Added the application seam for reading local authorization data from SADAdministracion. |
| `src/Application/Common/Models/SadAdministracionUserAccess.cs` | Created | Added the DTO carrying active user, role, and permission data for backend session bootstrap. |
| `src/Infrastructure/Data/SADAdministracionContext.cs` | Created | Added a minimal EF Core context mapped to the shared ADMIN schema tables needed for NewSAD authorization reads. |
| `src/Infrastructure/Data/SADAdministracionEntities.cs` | Created | Added internal entity shapes matching the subset of SADAdministracion tables required for access resolution. |
| `src/Infrastructure/Services/SadAdministracionAccess.cs` | Created | Added the infrastructure service that resolves active users plus role- and user-based permissions. |
| `src/Infrastructure/ConfigureServices.cs` | Updated | Registered the SAD connection-backed EF Core context and access seam in DI. |
| `src/Infrastructure/Infrastructure.csproj` | Updated | Added EF Core SQL Server dependency for the shared authorization context. |
| `src/Web/WebApi/appsettings.json` | Updated | Added the placeholder SAD connection string entry required by the new infrastructure registration. |
| `src/Domain/Common/ApiResponse.cs` | Created | Added the generic/non-generic operation result model used by application commands. |
| `src/Domain/Constants/Roles.cs` | Created | Added shared admin role constants aligned with the SADAlumnos authorization shape. |
| `src/Application/Common/Mediator/*` | Created | Added the minimal request/handler/dispatcher contracts needed for SADAlumnos-style application commands. |
| `src/Application/ConfigureServices.cs` | Updated | Registered the request dispatcher and automatic handler discovery for application commands. |
| `src/Application/Application.csproj` | Updated | Added Scrutor to support handler registration scanning. |
| `src/Application/Auth/Commands/UserLogin/UserLogin.cs` | Created | Added the session admission command that authorizes any active local user and denies missing or inactive users. |
| `src/Application/Auth/Commands/UserLogin/SessionAuthorizationSnapshot.cs` | Created | Added the session authorization payload returned by the local admission command. |
| `src/Web/WebApi/Services/SessionPrincipalFactory.cs` | Created | Added the SADAlumnos-shaped principal factory that resolves local session claims, stamps revalidation time, and exposes session failure headers for API callers. |
| `src/Web/WebApi/ConfigureServices.cs` | Updated | Added cookie + OIDC authentication wiring, safe return-url normalization, local session revalidation, and OIDC failure redirects. |
| `src/Web/WebApi/Program.cs` | Updated | Enabled authentication and authorization middleware for the Web API host. |
| `src/Web/WebApi/WebApi.csproj` | Updated | Added the OpenID Connect package needed for Web API authentication wiring. |
| `src/Web/WebApi/appsettings.json` | Updated | Added Keycloak configuration placeholders required by the new OIDC registration. |
| `src/Web/WebApi/appsettings.Development.json` | Updated | Added development Keycloak configuration placeholders for local environment wiring. |
| `src/Web/WebApi/Extension/IEndpoint.cs` | Created | Added the SADAlumnos-style minimal API endpoint contract used for endpoint auto-discovery. |
| `src/Web/WebApi/Extension/EndpointExtensions.cs` | Created | Added endpoint discovery and mapping helpers so endpoint slices can register cleanly. |
| `src/Web/WebApi/Endpoints/Auth/AuthEndpoints.cs` | Created | Added login, logout, and `user-info` endpoints that reuse the current cookie/OIDC session foundation and SPA auth-status headers. |
| `src/Web/WebApi/Endpoints/Portal/PortalEndpoints.cs` | Created | Added the authenticated bootstrap endpoint that returns the current user plus preserved portal links, reports, and theme metadata. |
| `src/Web/WebApi/ConfigureServices.cs` | Updated | Registered endpoint auto-discovery and a configuration-backed `PortalConfiguration` singleton for bootstrap payload mapping. |
| `src/Web/WebApi/Program.cs` | Updated | Mapped discovered minimal API endpoints in the host pipeline. |
| `openspec/changes/newsad-dotnet-angular-migration/tasks.md` | Updated | Marked task 2.3 complete for the fifth autonomous slice. |
| `src/Web/WebUI/src/app/core/**` | Created | Added Angular auth/session bootstrap primitives: auth guard, auth interceptor, bootstrap store, minimal protected layout, and app initializer. |
| `src/Web/WebUI/src/app/features/auth/**` | Created | Added the NewSAD session store, login entry page, and auth service wired to `/api/auth/user-info`, `/api/auth/login`, and `/api/auth/logout`. |
| `src/Web/WebUI/src/app/shared/components/error.ts` | Created | Added a minimal recoverable error route for session and portal bootstrap failures. |
| `src/Web/WebUI/src/app/app.config.ts` | Updated | Registered router, HTTP interceptor, and auth-session initializer for protected SPA startup. |
| `src/Web/WebUI/src/app/app.routes.ts` | Updated | Added login/error routes plus protected shell routing behind the auth guard. |
| `src/Web/WebUI/src/app/app.ts` | Updated | Kept the root app as a minimal OnPush router host. |
| `src/Web/WebUI/src/app/features/foundation/foundation.ts` | Updated | Reworked the placeholder landing page to display protected bootstrap data without porting the full shell yet. |
| `openspec/changes/newsad-dotnet-angular-migration/tasks.md` | Updated | Marked task 3.1 complete for the sixth autonomous slice. |
| `src/Web/WebUI/src/app/core/layout/layout.ts` | Updated | Replaced the placeholder protected header with a shared Angular shell layout that renders the migrated header/footer and applies bootstrap theme config. |
| `src/Web/WebUI/src/app/core/layout/components/header.ts` | Created | Ported the Astro header into Angular with preserved branding, all external portal links, theme toggle, FEN mail link, and user actions. |
| `src/Web/WebUI/src/app/core/layout/components/footer.ts` | Created | Ported the Astro footer into the Angular layout shell. |
| `src/Web/WebUI/src/app/core/stores/theme-store.ts` | Created | Added theme preference storage and runtime theme application driven by the backend bootstrap theme configuration. |
| `src/Web/WebUI/src/app/core/models/portal-bootstrap.ts` | Updated | Typed the portal theme payload with explicit theme modes for the Angular shell. |
| `src/Web/WebUI/src/app/features/foundation/foundation.ts` | Updated | Adjusted the landing content so slice 3.2 reflects shell parity progress while still deferring report rendering. |
| `src/Web/WebUI/src/styles.scss` | Updated | Added shared light/dark layout tokens and dropdown/card theming to match the migrated shell behavior. |
| `src/Web/WebUI/public/logo-fen-white-letters.svg` | Created | Materialized the branding asset inside the Angular public folder so the migrated header resolves its logo at build/runtime. |
| `pnpm-workspace.yaml` | Updated | Declared the root and `src/Web/WebUI` as workspace packages so pnpm can materialize Angular dependencies in the nested frontend workspace. |
| `openspec/changes/newsad-dotnet-angular-migration/tasks.md` | Updated | Marked task 3.2 complete for the seventh autonomous slice. |
| `src/Web/WebUI/src/app/features/portal/portal.ts` | Created | Replaced the temporary foundation landing page with a bootstrap-driven authenticated portal page that summarizes the current session and hosts the report experience. |
| `src/Web/WebUI/src/app/features/reports/reports.ts` | Created | Added the report tabs feature that reads backend bootstrap metadata and switches between both configured Power BI views. |
| `src/Web/WebUI/src/app/features/reports/components/report-frame.ts` | Created | Added a lazy iframe-based Power BI renderer with a recoverable unavailable state, retry flow, and timeout protection that keeps the authenticated shell intact. |
| `src/Web/WebUI/src/app/app.routes.ts` | Updated | Routed the protected default shell entry to the new portal/report feature for slice 3.3. |
| `openspec/changes/newsad-dotnet-angular-migration/tasks.md` | Updated | Marked task 3.3 complete for the eighth autonomous slice. |
| `src/Web/WebApi/Program.cs` | Updated | Added static file hosting and SPA fallback so the cutover host serves the Angular shell after authentication gates resolve. |
| `src/Web/WebApi/WebApi.csproj` | Updated | Added SPA proxy metadata, package support, and the Angular project reference to align development hosting with the SADAlumnos shape. |
| `src/Web/WebApi/Properties/launchSettings.json` | Created | Added HTTP/HTTPS launch profiles with SpaProxy hosting startup registration for local cutover-oriented development. |
| `src/Web/WebUI/package.json` | Updated | Switched frontend start-up to HTTPS certificate bootstrap plus the direct Angular CLI launcher used by the ASP.NET proxy flow. |
| `src/Web/WebUI/angular.json` | Updated | Added build configurations and the `/api` development proxy so Angular development traffic stays aligned with the .NET host. |
| `src/Web/WebUI/WebUI.esproj` | Updated | Declared the publish asset directory for the Angular browser build output consumed by the Web API host. |
| `src/Web/WebUI/aspnetcore-https.js` | Created | Added development certificate export support for the Angular HTTPS dev server. |
| `src/Web/WebUI/start-dev.js` | Created | Added a cross-shell Angular dev-server bootstrap that starts the CLI over HTTPS without `.cmd` wrappers. |
| `src/Web/WebUI/src/proxy.conf.js` | Created | Added the Angular development proxy to forward `/api` requests to the HTTPS Web API host. |
| `openspec/changes/newsad-dotnet-angular-migration/tasks.md` | Updated | Marked task 4.1 complete for the ninth autonomous slice. |
| `tests/Application/Application.UnitTests.csproj` | Created | Added the backend application test project with xUnit, FluentAssertions, and Moq references for slice-one authorization coverage. |
| `tests/Application/Auth/Commands/UserLogin/UserLoginHandlerTests.cs` | Created | Added unit tests that prove active users are admitted and inactive users are denied by the local login command. |
| `tests/WebApi/WebApi.IntegrationTests.csproj` | Created | Added the Web API integration test project with ASP.NET Core host testing support. |
| `tests/WebApi/TestInfrastructure/*.cs` | Created | Added authenticated and login-challenge test hosts so protected endpoints can be exercised without external Keycloak dependencies. |
| `tests/WebApi/Endpoints/Auth/AuthEndpointsTests.cs` | Created | Added login and `user-info` tests that verify safe return-url handling and SPA auth-status behavior for missing sessions. |
| `tests/WebApi/Endpoints/Portal/PortalEndpointsTests.cs` | Created | Added bootstrap parity tests that verify protected endpoint auth behavior plus report/navigation/theme metadata mapping. |
| `src/Web/WebApi/Program.cs` | Updated | Exposed a partial `Program` entry point so the integration test host can boot the minimal API application. |
| `NewSAD.slnx` | Updated | Added the new backend test projects to the solution root. |
| `openspec/changes/newsad-dotnet-angular-migration/tasks.md` | Updated | Marked task 4.2 complete for the tenth autonomous slice. |
| `src/Web/WebUI/package.json` | Updated | Added the Angular test script plus Vitest and jsdom dev dependencies so frontend smoke coverage runs from the migrated WebUI workspace. |
| `src/Web/WebUI/angular.json` | Updated | Added the Angular `test` target using the unit-test builder required for standalone component smoke coverage. |
| `src/Web/WebUI/tsconfig.spec.json` | Updated | Enabled Vitest globals and spec-file inclusion for the new frontend smoke tests. |
| `src/Web/WebUI/src/app/app-cutover.spec.ts` | Created | Added cutover smoke coverage for migrated header parity, footer parity, and both Power BI report tabs inside the Angular shell. |
| `pnpm-workspace.yaml` | Updated | Removed the legacy root package from the workspace once Astro tooling was retired and only Angular package management remained. |
| `pnpm-lock.yaml` | Updated | Refreshed the workspace lockfile after moving package ownership to `src/Web/WebUI` and adding frontend test dependencies. |
| `package.json`, `astro.config.mjs`, `tsconfig.json` | Deleted | Removed obsolete Astro runtime and tooling configuration after parity checks passed. |
| `.vscode/extensions.json`, `.vscode/launch.json` | Deleted | Removed Astro-focused editor launch and extension recommendations that no longer apply after cutover. |
| `src/pages/index.astro`, `src/components/*.astro`, `src/layouts/Layout.astro`, `src/styles/*.scss` | Deleted | Removed the retired Astro shell implementation after Angular shell/report parity was covered by smoke tests. |
| `openspec/changes/newsad-dotnet-angular-migration/tasks.md` | Updated | Marked task 4.3 complete for the eleventh autonomous slice. |

## Workload / PR Boundary

- Mode: chained PR slice
- Chain strategy: feature-branch-chain
- Current work unit: Unit 4 — frontend cutover verification and Astro retirement
- Boundary: starts from the cutover-ready backend/auth/bootstrap flow with backend verification already green, then adds only frontend smoke coverage plus the Astro runtime/file removal required once migrated shell parity is proven

## Verification

- Static review of solution references, Angular workspace metadata, and portal config contract alignment with design.
- Command verification attempted after implementation; environment limitations are recorded in the apply summary.
- Static review of the new data-access seam against the SADAlumnos reference `SADAdministracionContext` and login-query shape to keep table names, schema, and role/permission resolution aligned.
- Static review of the new `UserLogin` command against the auth-session spec to confirm slice-one admission allows any active local user and denies missing or inactive users without adding extra permission gates.
- Static review of the new `SessionPrincipalFactory` and `ConfigureServices` wiring against the SADAlumnos auth/session flow to keep claim shaping, safe local return-url normalization, and cookie revalidation behavior aligned with the reference shape.
- Static review of the new auth and portal endpoints against the SADAlumnos minimal API shape and the current Astro header/report metadata to preserve external links and Power BI bootstrap details in the backend payload.
- `dotnet --version` and `node --version` were attempted from the repo shell and both failed because the executables are not available on PATH in this environment.
- Static review of the Angular auth/session/bootstrap flow against the SADAlumnos route, guard, and store shape to keep the protected-shell handshake aligned while intentionally stopping before full layout parity.
- Command verification should use the Windows toolchain paths provided in the session preflight for future slices when package installation/build execution is possible.
- Static review of the migrated Angular layout against the Astro `Header.astro` and `Footer.astro` files to preserve branding, footer copy, theme behavior, and every current external portal link while keeping report rendering out of scope for this slice.
- `corepack.cmd pnpm install` was run from the repo root after declaring `src/Web/WebUI` in `pnpm-workspace.yaml` so pnpm materialized Angular dependencies in the nested workspace.
- `src/Web/WebUI/node_modules/.bin/ng.cmd build` completed successfully from the Windows toolchain, confirming the Angular shell builds after the workspace materialization fix.
- Static review of the new Angular report flow against the Astro `src/components/Report.astro` behavior and backend `Portal.Reports` payload to preserve both Power BI views while moving the tab state into the protected Angular shell.
- `./node_modules/.bin/ng.cmd build` was attempted from WSL and failed because `.cmd` launchers are not directly executable in the shell.
- `"/mnt/c/Program Files/nodejs/node.exe" "./node_modules/@angular/cli/bin/ng.js" build` completed successfully from `src/Web/WebUI`, confirming the portal/report slice compiles with the Windows Node toolchain.
- Static review of NewSAD hosting/proxy files against the SADAlumnos `Program.cs`, `WebApi.csproj`, `WebUI.esproj`, `package.json`, and Angular proxy configuration to keep the runtime path aligned toward cutover.
- Windows toolchain verification should cover the Web API solution build plus Angular production build for this slice.
- `"/mnt/c/Program Files/dotnet/dotnet.exe" test "tests/Application/Application.UnitTests.csproj"` passed with 2/2 tests green.
- `"/mnt/c/Program Files/dotnet/dotnet.exe" test "tests/WebApi/WebApi.IntegrationTests.csproj"` passed with 5/5 tests green.
- Integration coverage now proves safe login redirect state, inactive-user denial, unauthenticated auth-status headers on protected endpoints, and bootstrap parity against configured navigation/report/theme metadata.
- Static parity review confirmed the Angular header/footer/report shell preserves the same slice-one branding, footer copy, external destinations, theme options, and both Power BI views previously sourced from the Astro shell.
- `"/mnt/c/Program Files/nodejs/node.exe" "$(wslpath -w src/Web/WebUI/node_modules/@angular/cli/bin/ng.js)" test --watch=false` passed with 3/3 Vitest smoke checks green.
- `"/mnt/c/Program Files/nodejs/node.exe" "$(wslpath -w src/Web/WebUI/node_modules/@angular/cli/bin/ng.js)" build` passed after the test-target wiring, confirming the Angular production build still succeeds post-cutover.
- `pnpm install` refreshed the workspace lockfile after moving test dependencies into `src/Web/WebUI`; pnpm reported ignored optional build scripts for `lmdb` and `msgpackr-extract`, but the Angular tests/build ran successfully afterward.

## Remaining Tasks

- None — apply tasks are complete for this change.
