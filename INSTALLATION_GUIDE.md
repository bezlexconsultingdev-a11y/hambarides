# Admin Dashboard - Option B Implementation Guide

## Required Dependencies

Install the following packages for the Modern Card Dashboard:

```bash
npm install lucide-react recharts clsx tailwind-merge
```

### Package Details:
- **lucide-react**: Modern icon library (replaces react-icons)
- **recharts**: Chart library for data visualizations
- **clsx**: Utility for constructing className strings
- **tailwind-merge**: Merge Tailwind CSS classes without conflicts

## Already Installed:
- React 18+
- TypeScript
- Vite
- TailwindCSS
- React Router

## File Structure

```
admin-dashboard/
├── src/
│   ├── components/
│   │   ├── AppBar.tsx          ✅ Created
│   │   ├── Sidebar.tsx         ✅ Created
│   │   ├── StatCard.tsx        ✅ Created
│   │   ├── StatusBadge.tsx     ✅ Created
│   │   ├── QuickActionCard.tsx ✅ Created
│   │   └── [more components]
│   ├── pages/
│   │   ├── DashboardPageNew.tsx ✅ Created
│   │   └── [existing pages to be updated]
│   ├── lib/
│   │   └── utils.ts            ✅ Created
│   └── App.tsx                 (to be updated)
```

## Next Steps

1. Install dependencies:
   ```bash
   cd admin-dashboard
   npm install lucide-react recharts clsx tailwind-merge
   ```

2. Update App.tsx to use new layout

3. Test the new dashboard

4. Gradually migrate other pages to the new design

## Color Scheme (SA Flag Colors)

```css
--green: #007749
--navy: #001489
--gold: #FFB81C
--red: #E03C31
```

## Component Usage Examples

### StatCard
```tsx
<StatCard
  title="Total Revenue"
  value="R 125,450.80"
  trend="+8.2%"
  trendDirection="up"
  icon={<DollarSign />}
  sparklineData={[12, 15, 18, 20]}
/>
```

### StatusBadge
```tsx
<StatusBadge
  status="Completed"
  variant="success"
  size="md"
/>
```

### QuickActionCard
```tsx
<QuickActionCard
  title="SOS Alerts"
  count={2}
  icon={<AlertTriangle />}
  onClick={() => navigate('/sos-alerts')}
  urgent={true}
  color="red"
/>
```
