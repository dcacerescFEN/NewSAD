## Verification Report

**Change**: newsad-dotnet-angular-migration
**Version**: N/A
**Mode**: Standard

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 12 |
| Tasks complete | 12 |
| Tasks incomplete | 0 |

### Build & Tests Execution
**Build**: ✅ Passed
```text
"/mnt/c/Program Files/dotnet/dotnet.exe" build "NewSAD.slnx"
Build succeeded.
0 Warning(s)
0 Error(s)

"/mnt/c/Program Files/nodejs/node.exe" "C:\Users\dcaceresc\source\testing\NewSAD\src\Web\WebUI\node_modules\@angular\cli\bin\ng.js" build
Application bundle generation complete.
Output location: C:\Users\dcaceresc\source\testing\NewSAD\src\Web\WebUI\dist\webui
```

**Tests**: ✅ 10 passed / ❌ 0 failed / ⚠️ 0 skipped
```text
"/mnt/c/Program Files/dotnet/dotnet.exe" test "tests/Application/Application.UnitTests.csproj"
Passed: 2, Failed: 0, Skipped: 0, Total: 2

"/mnt/c/Program Files/dotnet/dotnet.exe" test "tests/WebApi/WebApi.IntegrationTests.csproj"
Passed: 5, Failed: 0, Skipped: 0, Total: 5

"/mnt/c/Program Files/nodejs/node.exe" "C:\Users\dcaceresc\source\testing\NewSAD\src\Web\WebUI\node_modules\@angular\cli\bin\ng.js" test --watch=false
Test Files: 1 passed
Tests: 3 passed
```

**Coverage**: Not available / threshold: 0% → ➖ Not available

### Spec Compliance Matrix
| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Guarded Shell Access and Navigation | Authenticated user reaches the shell | `src/Web/WebUI/src/app/app-cutover.spec.ts > renders the migrated header...`; `tests/WebApi/Endpoints/Portal/PortalEndpointsTests.cs > Bootstrap_ShouldReturnConfiguredPortalParity_ForAuthenticatedUser` | ⚠️ PARTIAL |
| Guarded Shell Access and Navigation | Unauthenticated request is intercepted | `tests/WebApi/Endpoints/Portal/PortalEndpointsTests.cs > Bootstrap_ShouldReturnAuthStatusHeaders_WhenSessionIsMissing`; static review of `src/Web/WebUI/src/app/core/guards/auth-guard.ts` | ⚠️ PARTIAL |
| Runtime Structure Without Astro | Migrated runtime serves the application | (none found) | ❌ UNTESTED |
| Runtime Structure Without Astro | Cutover removes Astro dependency | (none found) | ❌ UNTESTED |
| Legacy Shell Parity | Existing shell cues remain available | `src/Web/WebUI/src/app/app-cutover.spec.ts > renders the migrated header...`; `src/Web/WebUI/src/app/app-cutover.spec.ts > renders the migrated footer copy` | ✅ COMPLIANT |
| Legacy Shell Parity | Slice-one navigation remains equivalent | `src/Web/WebUI/src/app/app-cutover.spec.ts > renders the migrated header...` | ✅ COMPLIANT |
| Authenticated Report Visibility | Any authenticated user can view reports | `src/Web/WebUI/src/app/app-cutover.spec.ts > keeps both Power BI views reachable inside the Angular report shell` | ✅ COMPLIANT |
| Authenticated Report Visibility | Protected reports are not shown anonymously | `tests/WebApi/Endpoints/Portal/PortalEndpointsTests.cs > Bootstrap_ShouldReturnAuthStatusHeaders_WhenSessionIsMissing`; static review of `src/Web/WebUI/src/app/core/guards/auth-guard.ts` | ⚠️ PARTIAL |
| Report Availability Feedback | Report load failure does not break the portal | (none found) | ❌ UNTESTED |
| Report Availability Feedback | User retries after a transient failure | (none found) | ❌ UNTESTED |
| Federated Sign-In Bootstrap | Authorized user starts a session | `tests/Application/Auth/Commands/UserLogin/UserLoginHandlerTests.cs > Handle_ShouldAuthorizeActiveUser_WhenLocalAccessExists`; `tests/WebApi/Endpoints/Portal/PortalEndpointsTests.cs > Bootstrap_ShouldReturnConfiguredPortalParity_ForAuthenticatedUser` | ⚠️ PARTIAL |
| Federated Sign-In Bootstrap | Missing or inactive local user is denied | `tests/Application/Auth/Commands/UserLogin/UserLoginHandlerTests.cs > Handle_ShouldDenyUser_WhenLocalAccessIsInactive` | ⚠️ PARTIAL |
| Portal Admission Policy | Minimally authorized local user can enter | (none found) | ❌ UNTESTED |
| Portal Admission Policy | Invalidated session requires a new sign-in | `tests/WebApi/Endpoints/Auth/AuthEndpointsTests.cs > UserInfo_ShouldReturnAuthStatusHeaders_WhenSessionIsMissing`; `tests/WebApi/Endpoints/Portal/PortalEndpointsTests.cs > Bootstrap_ShouldReturnAuthStatusHeaders_WhenSessionIsMissing` | ✅ COMPLIANT |

**Compliance summary**: 5/14 scenarios compliant

### Correctness (Static Evidence)
| Requirement | Status | Notes |
|------------|--------|-------|
| Proposal scope | ✅ Implemented | Layered .NET backend, Angular WebUI, Keycloak settings, local authorization seam, shell/report cutover, and Astro removal are present. |
| Task completion | ✅ Implemented | All 12 tasks are checked complete in `tasks.md` and reflected in `apply-progress.md`. |
| Auth/session admission | ✅ Implemented | `SessionPrincipalFactory`, `ConfigureServices`, and auth endpoints enforce local authorization before establishing/refreshing session claims. |
| Portal bootstrap contract | ✅ Implemented | `PortalEndpoints` and `appsettings.json` deliver navigation links, reports, and theme metadata from the backend. |
| Report unavailable UX | ✅ Implemented | `report-frame.ts` keeps the shell intact and exposes retry/unavailable states, but runtime coverage is missing. |

### Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| Full replacement over hybrid runtime | ✅ Yes | Astro source/tooling artifacts are removed and the host now serves Angular via Web API fallback/static files. |
| Reuse SADAlumnos auth/session pattern | ✅ Yes | Cookie auth, OIDC challenge, local snapshot claims, and periodic revalidation are implemented in Web API. |
| Serve portal config from backend | ✅ Yes | Navigation, reports, and theme data are served from `PortalConfiguration` backed by `appsettings.json`. |

### Issues Found
**CRITICAL**:
- Spec verification is incomplete: 9 of 14 required scenarios do not have fully covering passing tests, so the change does not satisfy the SDD runtime-evidence gate.
- No passing runtime test proves the migrated application route renders the guarded Angular shell end-to-end after authentication.
- No passing runtime test proves unauthenticated shell/report route requests redirect into the auth flow on the SPA path itself.
- No passing runtime test covers report failure/retry behavior even though `report-frame.ts` implements it.
- No passing runtime test proves the cutover runtime operates entirely without Astro beyond static file/build inspection.
- No passing runtime test proves a minimally authorized non-privileged local user can enter the shell.

**WARNING**:
- Coverage metrics are not produced, so changed-file/test-depth confidence relies on targeted test inspection rather than measurable coverage.
- Federated sign-in is only partially verified because tests mock/session-seam the authenticated state instead of exercising the real OIDC callback flow.

**SUGGESTION**:
- Add a frontend routing/integration test (or Playwright smoke) that starts unauthenticated, validates redirect/login start, then validates authenticated shell landing.
- Add component tests for `ReportFrame` error timeout, load failure, and retry recovery.
- Add an integration test for a minimally privileged local user snapshot to prove slice-one admission without elevated roles.
- Add an end-to-end cutover smoke that boots Web API + Angular assets together and confirms SPA fallback works without Astro artifacts.

### Verdict
FAIL
Implementation is largely in place and current builds/tests pass, but the change is not ready for archive because required spec scenarios still lack passing runtime coverage.
