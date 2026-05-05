# Task ID: 5 - Mobile UI Agent A

## Task
Mobile-optimize `overview-dashboard.tsx` and `live-queue.tsx` for a mobile-first PWA with bottom tab bar.

## Changes Made

### File 1: `/src/components/queue-flow/overview-dashboard.tsx`

1. **Stat cards grid**: Changed from `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` to `grid-cols-2 gap-3 sm:grid-cols-4`. Stat values bumped to `text-3xl`, labels made more compact (`text-[11px]`), trend badge shrunk (`text-[10px] px-1.5`), card padding reduced (`p-3 sm:p-4`), icon container shrunk (`p-2 rounded-lg`, `w-4 h-4`), trendLabel hidden on mobile (`hidden sm:block`). Stat labels shortened (e.g. "Total in Queue" → "In Queue", "Avg Wait Time" → "Avg Wait").

2. **Chart heights**: Queue activity bar chart container changed from `h-64` to `h-48 sm:h-64`. Channel pie chart changed from `h-52` to `h-40 sm:h-52`. Pie inner/outer radius reduced for mobile (`45`/`70` vs `55`/`85`).

3. **Recent Boardings**: Replaced the full `<Table>` with compact mobile card list. Each boarding is a horizontal card (`flex items-center gap-2.5 p-2.5 rounded-lg`) showing: bold mono vehicle plate, truncated driver name, passenger count badge ("14 pax"), time (hidden on mobile), and status badge — all in a single row.

4. **Queue by Location**: Kept as is (already compact).

5. **Peak Hours Heatmap**: Cells changed from fixed `h-12` to `min-h-[32px] h-10` for touch-friendliness.

6. **Overall spacing**: `space-y-6` → `space-y-4` throughout. Page header `text-2xl` → `text-xl`. Charts grid gap `gap-6` → `gap-4`.

7. **Removed unused imports**: `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` no longer imported.

### File 2: `/src/components/queue-flow/live-queue.tsx`

1. **Queue Stats Bar**: 2x2 grid kept as `grid-cols-2 gap-3`. Card padding reduced (`p-2.5`), icon boxes shrunk (`w-8 h-8`), icon size `w-4 h-4` (from `w-4.5 h-4.5`), gap reduced (`gap-2.5`). Height is auto (no fixed height).

2. **Search/Filter bar**: Kept as is (already mobile-friendly).

3. **Queue Entries List**:
   - Card padding: `p-3` → `p-2.5`
   - Ticket circle: `w-12 h-12` → `w-10 h-10`, font `text-sm` → `text-xs`
   - Badges stacked vertically (removed `flex-wrap` horizontal layout, used `flex-col gap-0.5`)
   - Action buttons: touch-friendly `h-9 min-w-[44px]` (was `h-8`), button labels hidden on mobile (`hidden sm:inline`), icon-only on small screens
   - Phone number hidden on mobile (`hidden sm:inline`)

4. **Export button**: Kept as is.

5. **Header**: `text-2xl` → `text-xl`, spacing tightened. Export/Simulate button labels hidden on mobile (`hidden sm:inline`), shorter mobile labels ("+ Entry" instead of "Simulate New Entry").

6. **Overall spacing**: `space-y-6` → `space-y-4` throughout.

## Verification
- ESLint: Pre-existing error in `page.tsx` (`UserPlus` not defined) — not related to these changes.
- Dev server: Compiled successfully, all routes returning 200 OK.
