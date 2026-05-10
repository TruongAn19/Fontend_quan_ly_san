# Technical Specification: Badminton to Football Refactoring

This document serves as the technical ground truth for the refactoring process. All AI-driven or manual changes must adhere to the rules defined herein.

## 1. Domain Object Mapping
To ensure consistency across the codebase (Java, DB, Frontend), use the following naming convention:

| Category | Badminton (Current) | Football (New) | Code Identifier (Java/TS) | DB Identifier (snake_case) |
| :--- | :--- | :--- | :--- | :--- |
| **Main Facility** | Court / Product | Pitch Complex | `Product` (Keep for now) | `products` |
| **Sub-unit** | SubCourt | SubPitch | `SubPitch` | `sub_pitches` |
| **Rental Item** | Racket | Equipment | `Equipment` | `equipments` |
| **Time Slot** | AvailableTime | BookingSlot | `AvailableTime` (Keep) | `available_time` |
| **Feature** | Match Finding | N/A | [TO BE REMOVED] | [TO BE DROPPED] |

## 2. Refactoring Rules
### 2.1 Backend (Java/Spring Boot)
- **Tooling**: Use IDE refactoring tools (`Shift+F6`) for class renaming to update all references automatically.
- **Package Updates**: If a package name contains `badminton`, it must be renamed to `football`.
- **Method Names**: Any method containing `Court` (e.g., `findByCourtId`) should be renamed to use `Pitch` (e.g., `findByPitchId`).

### 2.2 Database (MySQL/Flyway)
- **Migration Strategy**: Do NOT modify existing `V1` to `V8` scripts. Create a new `V9__refactor_to_football.sql`.
- **SQL Template**:
  ```sql
  RENAME TABLE sub_courts TO sub_pitches;
  RENAME TABLE rackets TO rental_equipments;
  -- Update columns in join tables
  ALTER TABLE court_time CHANGE COLUMN court_id pitch_id BIGINT;
  ```

### 2.3 Frontend (Angular/HTML)
- **Terminology**: Replace all occurrences of "Sân cầu lông" with "Sân bóng đá".
- **i18n**: If the project uses an `assets/i18n/*.json` file, update the keys and values there first.
- **Icons**:
  - Replace `fa-badminton-racket` (or similar) with `fa-futbol`.

## 3. Feature Removal Protocol (Match Finding)
The following components must be systematically removed or disabled:
1. **Controllers**: `MatchPostController`, `ChatSocketController`.
2. **Services**: `MatchPostService`, `ChatService`, `MatchParticipantService`.
3. **Domain**: `MatchPost`, `MatchParticipant`, `ChatMessage`.
4. **Security**: Ensure WebSocket endpoints for `/chat/**` are removed from SecurityConfig.

## 4. AI Assistant Persona
- **Role**: Football Field Management Consultant.
- **Goal**: Assist users in booking pitches, renting football gear, and checking availability.
- **Constraint**: Do not provide information related to badminton rules or equipment.

---

## 5. Verification Checklist (Definition of Done)
- [ ] Project compiles successfully (`mvn clean compile`).
- [ ] No mention of "badminton" or "racket" remains in the public API documentation.
- [ ] Database schema is updated and Flyway migration succeeds.
- [ ] Frontend displays "Sân bóng đá" and shows football-related icons.
