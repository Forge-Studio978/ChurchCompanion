# Christian Center - Design Guidelines

## Design Approach
**System**: Material Design foundation with significant customization for a calm, spiritual aesthetic. Drawing inspiration from reading-focused apps like Kindle and meditation apps like Calm for the peaceful, distraction-free experience.

**Core Principles**: Spacious, contemplative design that respects sacred content. Every element serves spiritual practice—no social features, no engagement tricks, pure utility.

---

## Typography

**Primary Font**: Crimson Pro (serif) - for Bible text and hymn lyrics
- Headings: 600 weight
- Body text: 400 weight, 1.8 line height for comfortable reading
- Sizes: text-4xl (headings), text-lg (body), text-base (UI)

**Secondary Font**: Inter (sans-serif) - for UI elements, navigation, buttons
- Medium weight (500) for labels
- Regular (400) for descriptions

**Reading Mode**: Increase to text-xl with generous margins (max-w-2xl) for Bible/Hymn full-screen views

---

## Layout & Spacing

**Spacing System**: Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- Component padding: p-6 to p-8
- Section spacing: py-12 to py-16
- Card gaps: gap-6
- Form fields: space-y-4

**Container Strategy**:
- Main content: max-w-7xl mx-auto
- Reading content: max-w-3xl mx-auto
- Forms: max-w-md

**Grid Layouts**:
- Home dashboard: 2x2 grid on desktop (grid-cols-2), single column mobile
- Hymn library: Single column list with generous spacing
- Library view: 3-column grid on desktop (grid-cols-3), adapting to single column mobile

---

## Component Library

**Navigation**:
- Bottom tab bar (mobile): Bible | Hymns | Library | Livestream icons with labels
- Top navigation (desktop): Horizontal menu with user profile dropdown (right-aligned)
- Minimal, always accessible, no hamburger menus

**Cards**:
- Soft rounded corners (rounded-xl)
- Subtle elevation (shadow-sm)
- Generous internal padding (p-6)
- White background (light mode), subtle dark surface (dark mode)

**Buttons**:
- Primary: Rounded-lg, px-6 py-3, medium weight text
- Secondary: Outline style with same padding
- Icon buttons: Circular (rounded-full), p-3
- Blurred backgrounds when over images in hero sections

**Forms**:
- Single-column layout
- Labels above inputs (text-sm, font-medium)
- Input fields: Full width, rounded-lg, px-4 py-3, border
- Focus states: Subtle ring, no harsh outlines

**Bible Reader Interface**:
- Book/Chapter selector: Dropdown at top with breadcrumb trail
- Verse text: Large, serif, generous line-height
- Inline actions: Highlight (icon), Note (icon), Save (icon) appear on verse hover/tap
- Toolbar: Bottom-fixed on mobile (Highlight colors, Note, Font size, Theme toggle)

**Hymn Display**:
- Title: Large serif heading
- Metadata line: Composer, year, tune in smaller secondary text
- Lyrics: Verses clearly separated with spacing (mb-6 between verses)
- Audio player: Fixed bottom when playing (minimal controls: play/pause, progress bar, time)

**Livestream Notes Panel**:
- Desktop: Split screen (60% video/audio, 40% notes)
- Mobile: Tabs switching between media and notes
- Timestamp button visible in notes textarea for adding timestamps

**Home Dashboard**:
- Verse of Day: Card at top, centered, with share icon
- 2x2 grid of primary navigation cards below
- Each card: Icon (top), Title, Brief description
- Clean, spacious, calming presentation

---

## Visual Style

**Images**:
No large hero image. This is a utility app, not marketing.
- Verse of Day card: Optional subtle background texture or gentle gradient
- Empty states: Simple illustrations (Bible icon, hymn sheet icon)
- User profile: Avatar placeholder with initials

**Iconography**:
- Use Heroicons (outline style for navigation, solid for active states)
- Spiritual icons: Book (Bible), Music note (Hymns), Folder (Library), Radio (Livestream)

**Elevation & Depth**:
- Minimal shadows (shadow-sm for cards, shadow-md for modals)
- Flat design overall with subtle depth cues
- Avoid heavy drop shadows

---

## Interactions & States

**Animations**: Minimal, purposeful only
- Page transitions: Simple fade (200ms)
- Button press: Subtle scale (95%) on active state
- No scroll animations, no parallax

**Loading States**:
- Skeleton screens for content lists
- Spinner for page loads (centered, minimal)
- Progressive loading for Bible text

**Focus & Accessibility**:
- Visible focus rings on all interactive elements
- High contrast for readability
- Large tap targets (min 44x44px)
- Screen reader labels on all icons

---

## Theme Modes

**Light Mode**:
- Background: Warm off-white (not pure white)
- Text: Dark gray (not pure black)
- Cards: White with subtle shadow
- Accent: Muted teal or deep blue

**Dark Mode**:
- Background: Deep navy or charcoal (not pure black)
- Text: Soft white
- Cards: Lighter surface than background
- Maintain warm, peaceful feeling (avoid harsh blue-grays)

---

This design creates a reverent, focused space for personal worship—calm, readable, and distraction-free.