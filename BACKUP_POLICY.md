# Backup Policy

Backups capture all rooms, plants, photos and care events for each user by requesting `GET /api/backup`.

- **Recovery Point Objective (RPO):** 24 hours. Users should export backups at least once per day.
- **Recovery Time Objective (RTO):** 1 hour. Restores are expected to complete within one hour of initiation.

## Verification

Use `npm run backup:verify -- <userId>` to test backup and restore. The script exports data, wipes the records, restores them and verifies that counts match.
