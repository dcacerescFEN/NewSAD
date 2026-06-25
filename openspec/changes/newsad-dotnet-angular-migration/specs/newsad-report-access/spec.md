# NewSAD Report Access Specification

## Purpose

Define authenticated access to NewSAD Power BI content in the migrated portal.

## Requirements

### Requirement: Authenticated Report Visibility

The system MUST allow every authenticated and locally authorized user to view the Power BI content included in slice one.

#### Scenario: Any authenticated user can view reports

- GIVEN a user has a valid NewSAD session
- WHEN the user opens the report area
- THEN the user can access every Power BI view included in slice one
- AND no additional role filter is required for report visibility

#### Scenario: Protected reports are not shown anonymously

- GIVEN no valid NewSAD session exists
- WHEN the report area is requested
- THEN the system blocks report rendering until the user authenticates successfully

### Requirement: Report Availability Feedback

The system MUST preserve the authenticated shell when a report cannot load and SHALL present a recoverable unavailable state.

#### Scenario: Report load failure does not break the portal

- GIVEN an authenticated user opens a report view
- AND the selected Power BI content cannot be loaded
- WHEN the failure is detected
- THEN the system keeps the user in the shell and shows a report-unavailable state

#### Scenario: User retries after a transient failure

- GIVEN a report previously failed to load for an authenticated user
- WHEN the user retries access after the underlying issue clears
- THEN the system renders the requested report without requiring a new authorization decision
