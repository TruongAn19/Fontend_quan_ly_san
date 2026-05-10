# Detailed Refactoring Checklist: Badminton to Football Field Management

This checklist provides a step-by-step guide to refactoring the project and removing the "Match Finding" feature as requested.

## ✅ Phase 1: Feature Removal (Match Finding)
*Objective: Remove code related to finding opponents and matching players.*

- [ ] **Domain Entities**:
    - [ ] Delete `MatchPost.java`
    - [ ] Delete `MatchParticipant.java`
    - [ ] Delete `ChatMessage.java`
- [ ] **Repositories**:
    - [ ] Delete `MatchPostRepository.java`
    - [ ] Delete `MatchParticipantRepository.java`
    - [ ] Delete `ChatMessageRepository.java`
- [ ] **Services**:
    - [ ] Delete `MatchPostService.java`
    - [ ] Delete `MatchParticipantService.java`
    - [ ] Delete `ChatService.java`
- [ ] **Controllers**:
    - [ ] Delete `MatchPostController.java`
    - [ ] Delete `ChatSocketController.java`
- [ ] **Frontend**:
    - [ ] Remove "Tìm đối thủ" / "Match Finding" menu items from navigation.
    - [ ] Delete components/pages related to matching and chat.
- [ ] **Database**:
    - [ ] Create a migration to drop tables: `match_posts`, `match_participants`, `chat_messages`.

---

## 🏗️ Phase 2: Core Domain Refactoring (Terminology)
*Objective: Update names from Badminton to Football.*

- [ ] **Entity Renaming (Java Classes)**:
    - [ ] `SubCourt` → `SubPitch`
    - [ ] `Racket` → `Equipment`
    - [ ] `RacketStockByDate` → `EquipmentStockByDate`
- [ ] **Variable/Field Renaming**:
    - [ ] In `Product`: `subCourtNames` → `subPitchNames`.
    - [ ] In `BookingDetail`: `racket` → `equipment`.
    - [ ] Global search and replace for "court" (if applicable) → "pitch".
- [ ] **Enum/Type Updates**:
    - [ ] Update any categories (e.g., Badminton → Football).

---

## 💾 Phase 3: Database & Seed Data
*Objective: Align the database schema and initial data with football.*

- [ ] **SQL Migration**:
    - [ ] Create `V9__refactor_to_football.sql`.
    - [ ] Rename tables: `sub_courts` → `sub_pitches`, `rackets` → `rental_equipments`.
    - [ ] Update column names in join tables.
- [ ] **Seed Data Update**:
    - [ ] Update `V4__seed_data.sql` to use football field names (e.g., "Sân bóng cỏ nhân tạo mini").
    - [ ] Update `V5__seed_racket_stock.sql` to seed balls/shoes instead of rackets.

---

## 🎨 Phase 4: Frontend UI/UX
*Objective: Visual and textual transition.*

- [ ] **Text Updates**:
    - [ ] "Sân cầu lông" → "Sân bóng đá"
    - [ ] "Vợt/Cầu" → "Bóng/Giày/Áo"
- [ ] **Images & Icons**:
    - [ ] Replace badminton icons with football icons (FontAwesome/SVG).
    - [ ] Upload new banner/placeholder images for football fields.
- [ ] **Business Logic**:
    - [ ] Check time slot duration (e.g., set default to 60/90 mins).

---

## 🤖 Phase 5: AI & Assistant
*Objective: Update the chatbot persona.*

- [ ] **System Prompt**: Update the instruction to "You are a professional football field booking assistant".
- [ ] **Knowledge Base**: Update data provided to AI about field rules and equipment.

---

## 🧪 Phase 6: Testing
- [ ] Verify booking flow with new names.
- [ ] Ensure equipment rental works for "Balls" instead of "Rackets".
- [ ] Verify the admin dashboard reflects "Pitches" correctly.
