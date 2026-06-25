# NewSAD Portal Shell Specification

## Purpose

Define the authenticated Angular portal shell that replaces the current Astro shell.

## Requirements

### Requirement: Guarded Shell Access and Navigation

The system MUST expose a guarded authenticated shell with shared header, footer, and primary navigation for slice one.

#### Scenario: Authenticated user reaches the shell

- GIVEN a user has a valid NewSAD session
- WHEN the user opens the main application route
- THEN the system renders the shared shell and the default authenticated landing view

#### Scenario: Unauthenticated request is intercepted

- GIVEN no valid NewSAD session exists
- WHEN a protected shell route is requested
- THEN the system redirects the user to the authentication flow instead of rendering protected content

### Requirement: Runtime Structure Without Astro

The system MUST run as a .NET backend plus Angular frontend and MUST NOT depend on Astro runtime, Astro routes, or Astro build artifacts after migration cutover.

#### Scenario: Migrated runtime serves the application

- GIVEN the migrated application is deployed
- WHEN a user opens NewSAD
- THEN the application is served entirely by the .NET plus Angular runtime structure

#### Scenario: Cutover removes Astro dependency

- GIVEN migration parity is accepted
- WHEN the production runtime is verified
- THEN NewSAD no longer requires Astro-specific tooling or artifacts to operate

### Requirement: Legacy Shell Parity

The system MUST preserve the current NewSAD branding, theme preference behavior, footer presence, and slice-one external navigation intent in the migrated shell.

#### Scenario: Existing shell cues remain available

- GIVEN an authenticated user opens the migrated shell
- WHEN the header and footer are rendered
- THEN the user can identify the existing branding and common shell actions expected from the current portal

#### Scenario: Slice-one navigation remains equivalent

- GIVEN the current portal exposes external module destinations
- WHEN the migrated shell is reviewed for parity
- THEN the same slice-one destinations remain discoverable to the user
