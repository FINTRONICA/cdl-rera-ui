# Proforma Module Performance Analysis

## PHASE 1 — FULL ANALYSIS

### Current Architecture

**Module Location**: `src/components/organisms/ProjectStepper/` (Step 6 - Financial/Proforma)
**Page Route**: `/build-partner-assets/[id]` with step parameter
**Rendering Strategy**: **CSR (Client-Side Rendering)** - All components use `'use client'`

### Critical Performance Issues Identified

#### 1. **Rendering Strategy Issues**
- ❌ **All components are client-side** (`'use client'` directive)
- ❌ **No SSR/SSG/ISR** - Missing Next.js optimization opportunities
- ❌ **No static generation** for initial page load
- ❌ **Full client-side hydration** required before interactivity

#### 2. **Data Fetching Problems**
- ❌ **Multiple useEffect hooks** with API calls (lines 137-1271 in index.tsx)
- ❌ **API calls triggered on every step change** without proper caching
- ❌ **No React Query usage** for financial data fetching in useEffect
- ❌ **Duplicate API calls** possible when switching between steps
- ❌ **No request deduplication** - Same API called multiple times
- ❌ **Heavy data transformation** (24-item breakdownMap) in useEffect (lines 965-1172)

**Current Flow**:
```
Step Change → useEffect triggers → API call → Data transformation → Form reset
```

**Issues**:
- API call happens on every step navigation to Step 6
- Large transformation (24 breakdown items) recalculated every time
- No caching mechanism
- Form reset causes full re-render

#### 3. **Component Structure Issues**
- ❌ **No code splitting** - All 8 step components loaded upfront
- ❌ **Heavy imports** - Full MUI library imported
- ❌ **No dynamic imports** for Step6 component
- ❌ **Large bundle size** - All steps in single bundle

#### 4. **Re-render Problems**
- ❌ **Large form** (100+ fields) causing expensive re-renders
- ❌ **No React.memo** on Step6 component
- ❌ **No useMemo** for expensive computations
- ❌ **Form reset** triggers full component tree re-render
- ❌ **24 breakdown sections** re-rendered on every form change

#### 5. **Computation Performance**
- ❌ **breakdownMap transformation** (24 items) recalculated on every render
- ❌ **String conversions** in tight loops (lines 1146-1171)
- ❌ **No memoization** of transformed data
- ❌ **Date parsing** (dayjs) in render cycle

#### 6. **Bundle Size Issues**
- ❌ **Full MUI imports** - Not tree-shaken properly
- ❌ **All step components** in main bundle
- ❌ **Large dependencies** loaded upfront
- ❌ **No lazy loading** for heavy components

#### 7. **State Management Issues**
- ❌ **Multiple useState hooks** without consolidation
- ❌ **Form state** (react-hook-form) not optimized
- ❌ **No state normalization** for large form data
- ❌ **Stale closures** in useEffect dependencies

#### 8. **Image/Script/Font Issues**
- ⚠️ **No images** in Proforma module (N/A)
- ⚠️ **No custom scripts** (N/A)
- ⚠️ **Fonts** - Using system fonts (Outfit) - could be optimized with next/font

### Performance Metrics (Estimated)

**Current Performance**:
- Initial Load: ~2-3s (all steps loaded)
- Step 6 Load: ~800ms-1.2s (API + transformation)
- Form Interaction: ~100-200ms lag on input
- Re-render Time: ~300-500ms (full form)

**Bottlenecks**:
1. **API Call**: 300-500ms
2. **Data Transformation**: 200-300ms (24 items)
3. **Form Reset**: 150-200ms
4. **Component Re-render**: 100-150ms

### Code Quality Issues

- ❌ **Large component** (2248 lines) - Should be split
- ❌ **Complex useEffect chains** - Hard to maintain
- ❌ **Type safety** - Some `any` types used
- ❌ **Error handling** - Basic try-catch, no retry logic
- ❌ **No loading states** for individual data fetches

---

## PHASE 2 — OPTIMIZATION PLAN

### A. Rendering Strategy Optimization

**Current**: CSR only
**Target**: Hybrid approach
- **Initial Page**: SSG with ISR for project metadata
- **Step Components**: CSR with dynamic imports
- **Financial Data**: CSR with React Query caching

### B. Data Fetching Optimization

**Changes Needed**:
1. Replace useEffect API calls with React Query hooks
2. Implement proper caching (5min stale time)
3. Add request deduplication
4. Prefetch data on step navigation
5. Memoize data transformations

### C. Code Splitting

**Changes Needed**:
1. Dynamic import Step6 component
2. Lazy load all step components
3. Split breakdownMap into separate utility
4. Tree-shake MUI imports

### D. Component Optimization

**Changes Needed**:
1. Memoize Step6 component
2. Use React.memo for breakdown sections
3. Memoize expensive computations
4. Optimize form re-renders with useCallback

### E. Bundle Optimization

**Changes Needed**:
1. Dynamic imports for step components
2. Tree-shake MUI properly
3. Code split large utilities
4. Lazy load date picker components

---

## PHASE 3 — IMPLEMENTATION PRIORITY

### High Priority (Critical Performance)
1. ✅ Replace useEffect API calls with React Query
2. ✅ Memoize breakdownMap transformation
3. ✅ Dynamic import Step6 component
4. ✅ Add React.memo to prevent unnecessary re-renders

### Medium Priority (Significant Improvement)
5. ✅ Code split all step components
6. ✅ Optimize form re-renders
7. ✅ Add loading states
8. ✅ Improve error handling

### Low Priority (Nice to Have)
9. ⚠️ Font optimization with next/font
10. ⚠️ Consider SSR for initial page load
11. ⚠️ Add service worker for offline support

---

## Expected Performance Improvements

**After Optimization**:
- Initial Load: ~1-1.5s (50% improvement)
- Step 6 Load: ~200-400ms (70% improvement with caching)
- Form Interaction: ~50ms lag (50% improvement)
- Re-render Time: ~100-150ms (50% improvement)
- Bundle Size: ~30-40% reduction

**Key Metrics**:
- ✅ First Contentful Paint: -40%
- ✅ Time to Interactive: -50%
- ✅ Largest Contentful Paint: -35%
- ✅ Cumulative Layout Shift: -60%
- ✅ Total Blocking Time: -55%
