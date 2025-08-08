# Privacy Policy

This project stores plant care information for each authenticated user. The data includes rooms, plants, photos and care events needed to provide the application's features. Data is never shared with third parties.

## Data export

Users can export their data at any time by requesting `GET /api/backup`, which returns a JSON file containing all records for the authenticated account.

## Data deletion

Users may delete their data by calling `DELETE /api/backup`. This removes all rooms, plants, photos and care events for the authenticated user.
