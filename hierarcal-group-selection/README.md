# Trainer Hierarchy Selector Module

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![MUI](https://img.shields.io/badge/MUI-007FFF?style=flat-square&logo=mui&logoColor=white)

## Overview

The **Trainer Hierarchy Selector** is a specialized, high-performance React component designed to handle **Hierarchical Data Selection** (User Trees, Org Charts, Category Trees).

It solves the common problem of selecting items from deep structures where context (Who reports to whom?) is just as important as the item itself.

**Key Capabilities:**
- **Dual-View Interface**:
  - 🌳 **Tree Mode**: Preserves parent-child relationships using a recursive UI.
  - 📜 **Flat Mode**: Optimized for rapid searching using virtualization.
- **Virtualized Rendering**: Capable of handling **10,000+ nodes** without UI freezing using `react-window`.
- **Smart State Management**: Handles complex logic like "promoting" children when a parent is excluded from the list.
- **User-Centric Features**: Auto-expansion of selected branches, search term highlighting, and keyboard navigation.

---

## 📦 Dependencies

Ensure these peer dependencies are installed in your project:

```json
"dependencies": {
  "@mui/material": "^6.2.0",
  "@mui/icons-material": "^6.2.1",
  "@mui/x-tree-view": "^8.25.0",
  "react-window": "^2.2.5",
  "react": "^19.0.0",
  "next": "15.5.9",
}
```

---

## 🚀 Usage Scenarios

### Scenario 1: Standard Single Select
Basic usage for selecting a reporting manager.

```tsx
import { useState } from 'react';
import TrainerField from '@/components/TrainerField';

const AssignManager = ({ employees }) => {
  const [managerId, setManagerId] = useState<number | null>(null);

  return (
    <TrainerField
      mode="single"
      trainers={employees}
      value={managerId}
      onChange={setManagerId}
      loading={!employees.length}
    />
  );
};
```

### Scenario 2: Integration with React Hook Form
The component is fully compatible with standard form libraries.

```tsx
import { useForm, Controller } from 'react-hook-form';
import TrainerField from '@/components/TrainerField';

const EmployeeForm = ({ trainers }) => {
  const { control, handleSubmit } = useForm();

  const onSubmit = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="reportingManager"
        control={control}
        render={({ field: { value, onChange } }) => (
          <TrainerField
            mode="single"
            trainers={trainers}
            value={value}
            onChange={onChange}
          />
        )}
      />
      <button type="submit">Save</button>
    </form>
  );
};
```

### Scenario 3: Context-Aware Exclusion (Self-Exclusion)
When a user is selecting their own "Reporting Manager", they cannot report to themselves. Furthermore, if they are an admin, their direct reports shouldn't disappear—they should visually "bubble up" to the root or previous level.

**Visual Logic:**
```text
Original Tree:          If "Alice" (ID: 2) is excluded:
1. Root                 1. Root
   └── 2. Alice            ├── 3. Bob (Promoted)
       ├── 3. Bob          └── 4. Charlie (Promoted)
       └── 4. Charlie
```

**Implementation:**
```tsx
<TrainerField
  mode="single"
  trainers={allTrainers}
  value={selectedId}
  onChange={setSelectedId}
  // This automatically handles the re-parenting logic
  excludeUserId={currentUser.id} 
/>
```

### Scenario 4: Multi-Select for Bulk Actions
Useful for assigning multiple trainers to a specific course or region.

```tsx
<TrainerField
  mode="multi"
  trainers={allTrainers}
  selectedIds={selectedGroupIds} // number[]
  onMultiChange={(newIds) => {
    console.log("Selected IDs:", newIds);
    setSelectedGroupIds(newIds);
  }}
/>
```

---

## 🏗 Architecture & Data Flow

This module uses a **Unidirectional Data Flow** with internal state abstraction.

```mermaid
graph TD
    A[Raw DB Data] -->|useTrainerData| B(Hierarchy Builder)
    B -->|O(N) Transform| C{Data Structures}
    C -->|Tree Structure| D[Tree View]
    C -->|Flat List + Metadata| E[Virtual List]
    
    User -->|Type Search| F[useSearch Hook]
    F -->|Switch View| E
    
    User -->|Select Item| G[useSelection Hook]
    G -->|Update State| D
    G -->|Callback| Parent
```

### Key Architectural Decisions

1.  **Why Virtualization (`react-window`)?**
    *   **Problem**: Rendering a flat list of 5,000 employees generates 5,000 DOM nodes. Filtering this list causes massive layout thrashing.
    *   **Solution**: `react-window` only renders the items currently visible in the viewport (plus a small buffer).
    *   **Result**: Constant memory usage regardless of dataset size.

2.  **Why Pre-Calculated Enrichment?**
    *   **Problem**: In a flat list search result, we need to show "Reports to: John Doe". Finding "John Doe" for every row during a scroll event is expensive (O(N) lookups).
    *   **Solution**: We enrich the flat data object *once* during creation with `parentName` and `parentLevel`.
    *   **Result**: O(1) access during render.

3.  **Why Automatic Tree Reordering?**
    *   **Problem**: In a deep tree, if a selected item is at the bottom, the user might not see it when the component loads.
    *   **Solution**: `useReorderTree` detects the selected node's path and sorts that specific branch to the top of the list.

---

## 🧩 Component Interface

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `trainers` | `IDashboardTrainer[]` | Required | The raw flat array of data from the backend. |
| `mode` | `'single' \| 'multi'` | `'single'` | Determines selection behavior and return types. |
| `value` | `number \| null` | `null` | **(Single Mode)** The currently selected ID. |
| `onChange` | `(id: number \| null) => void` | - | **(Single Mode)** Callback when selection changes. |
| `selectedIds`| `number[]` | `[]` | **(Multi Mode)** Array of selected IDs. |
| `onMultiChange`| `(ids: number[]) => void` | - | **(Multi Mode)** Callback when selection changes. |
| `loading` | `boolean` | `false` | Shows a loading skeleton/spinner state. |
| `excludeUserId`| `number` | `undefined` | ID of a user to hide. Children of this user are preserved and promoted. |

---

## 🔧 Troubleshooting & Gotchas

### 1. "My Tree isn't expanding automatically"
*   **Cause**: The `expandedItems` logic relies on accurate `parentId` relationships.
*   **Fix**: Ensure your `IDashboardTrainer` data has valid `reporting_to` IDs that actually exist in the dataset. Orphans are handled, but might not trigger auto-expansion paths correctly if the chain is broken.

### 2. "Search is slow on very large datasets"
*   **Cause**: High frequency re-renders on every keystroke.
*   **Fix**: The component uses `useDebounce` internally (300ms delay). If it feels slow, check if the parent component is causing unnecessary re-renders by passing a new `trainers` array reference on every render. Use `useMemo` for the data passed in.

### 3. "Styles look broken"
*   **Cause**: Missing MUI Theme provider or CSS baseline.
*   **Fix**: Ensure your app is wrapped in MUI's `ThemeProvider` and `CssBaseline`.

---

## 📂 Folder Structure Breakdown

```text
src/
├── components/
│   ├── FlatListView.tsx       # ⚡️ The virtualized list engine
│   ├── SearchHeader.tsx       # Input field + View toggler
│   ├── SelectionSummary.tsx   # Badge counter & Clear button
│   ├── StatsFooter.tsx        # "Showing X of Y items"
│   └── TreeView.tsx           # Recursive MUI Tree wrapper
├── hooks/
│   ├── useTrainerData.ts      # 🏭 The Data Factory (Builds the tree)
│   ├── useSelection.ts        # 🎮 Selection Controller
│   ├── useSearch.ts           # 🔍 Filter logic
│   ├── useExpansion.ts        # 📂 Expansion State Manager
│   ├── useReorderTree.ts      # ↕️ UX Sort logic
│   └── useKeyboardNav.ts      # ⌨️ A11y Controller
├── utils/
│   ├── hierarchyBuilder.ts    # 🧮 Pure Math/Logic (The Brains)
│   └── highlightText.ts       # 🔦 Search highlighter
└── TrainerField.tsx           # 📦 Main Component
```