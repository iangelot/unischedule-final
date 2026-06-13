# Frontend Improvements Guide

## Overview

This document outlines all frontend improvements implemented to enhance user experience, accessibility, and code quality.

## 📋 Table of Contents

- [Form Validation](#form-validation)
- [Loading States](#loading-states)
- [Pagination](#pagination)
- [Responsive Design](#responsive-design)
- [Accessibility](#accessibility)
- [CSS Utilities](#css-utilities)

---

## Form Validation

### useForm Hook

Custom hook for managing form state with built-in validation.

**Features:**
- State management (values, errors, touched fields)
- Submission handling
- Field-level validation
- Touch tracking
- Form reset capability

**Usage:**

```jsx
import { useForm, FormField, Form } from '@/hooks/useForm';

function MyComponent() {
  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: async (values) => {
      // Handle form submission
      await api.login(values);
    },
    validate: (values) => {
      const errors = [];
      if (!values.email) {
        errors.push({ field: 'email', message: 'Email is required' });
      }
      return errors;
    },
  });

  return (
    <Form onSubmit={form.handleSubmit} errors={form.errors}>
      <FormField
        label="Email"
        name="email"
        type="email"
        required
        error={form.getFieldError('email')}
        isTouched={form.touched.email}
        value={form.values.email}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
      />
      {/* More fields */}
    </Form>
  );
}
```

### FormField Component

Reusable form field with error display.

**Props:**
- `label: string` - Field label
- `name: string` - Field name (must match form value key)
- `type?: string` - Input type (default: 'text')
- `required?: boolean` - Mark as required
- `error?: string` - Error message
- `isTouched?: boolean` - Whether field was interacted with
- `value: any` - Current field value
- `onChange, onBlur` - Event handlers
- `help?: string` - Help text (shown when no error)

**Features:**
- Automatic error styling
- Help text support
- Touch-based error display (only show errors after user interaction)
- Accessibility (proper labels, aria attributes)

---

## Loading States

### Spinner Component

Simple loading spinner for async operations.

```jsx
import { Spinner } from '@/components/Loading';

// In component
<Spinner size="md" color="currentColor" fullScreen={false} />

// Full screen spinner
<Spinner size="lg" fullScreen={true} />
```

**Props:**
- `size?: 'sm' | 'md' | 'lg'` - Spinner size
- `color?: string` - Color (CSS color value)
- `fullScreen?: boolean` - Display as overlay

### SkeletonTable Component

Placeholder for loading table data.

```jsx
import { SkeletonTable } from '@/components/Loading';

{isLoading ? (
  <SkeletonTable rows={5} columns={4} />
) : (
  <Table data={data} />
)}
```

### EmptyState Component

Display when no data available.

```jsx
import { EmptyState } from '@/components/Loading';

{items.length === 0 && (
  <EmptyState
    title="No items found"
    description="Get started by creating your first item"
    action={{
      label: 'Create Item',
      onClick: () => setShowCreate(true),
    }}
  />
)}
```

### Toast Notifications

For user feedback.

```jsx
import { useToast, Toast } from '@/components/Loading';

function MyComponent() {
  const { toasts, removeToast, success, error } = useToast();

  const handleAction = async () => {
    try {
      await api.doSomething();
      success('Action completed successfully!');
    } catch (err) {
      error('Failed to complete action');
    }
  };

  return (
    <>
      {/* Your component */}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </>
  );
}
```

---

## Pagination

### usePagination Hook

Manage pagination state.

```jsx
import { usePagination } from '@/components/Pagination';

function MyComponent({ items }) {
  const pagination = usePagination({
    totalItems: items.length,
    itemsPerPage: 10,
    currentPage: 1,
  });

  const pageData = items.slice(pagination.startIndex, pagination.endIndex);

  return (
    <>
      {/* Display page data */}
      {pageData.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}

      {/* Pagination controls */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={pagination.goToPage}
        canPreviousPage={pagination.canPreviousPage}
        canNextPage={pagination.canNextPage}
      />
    </>
  );
}
```

### PaginatedTable Component

Combines table with pagination.

```jsx
import { PaginatedTable } from '@/components/Pagination';

const columns = [
  { key: 'name', label: 'Name' },
  {
    key: 'email',
    label: 'Email',
    render: (value) => <a href={`mailto:${value}`}>{value}</a>,
  },
];

<PaginatedTable
  data={users}
  columns={columns}
  itemsPerPage={10}
  isLoading={isLoading}
  onRowClick={(user) => navigateToDetail(user.id)}
  selectable={true}
  selectedIds={selectedIds}
  onSelectionChange={setSelectedIds}
/>
```

---

## Responsive Design

### useResponsive Hook

Detect screen size and display accordingly.

```jsx
import { useResponsive } from '@/utils/responsive';

function MyComponent() {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </>
  );
}
```

### ResponsiveMenu Component

Mobile-friendly menu with drawer.

```jsx
import { ResponsiveMenu } from '@/utils/responsive';

function MyComponent() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <ResponsiveMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)}>
      {/* Menu items */}
      <a href="/home">Home</a>
      <a href="/about">About</a>
    </ResponsiveMenu>
  );
}
```

### Responsive CSS Classes

Tailwind CSS built-in responsive utilities + custom classes.

```jsx
// Mobile-first: 1 column, tablet: 2 columns, desktop: 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => (
    <Card key={item.id}>{item.name}</Card>
  ))}
</div>

// Responsive text size
<h1 className="text-lg md:text-2xl lg:text-4xl">Heading</h1>

// Responsive padding
<div className="p-2 md:p-4 lg:p-6">Content</div>
```

---

## Accessibility

### AccessibleButton Component

Button with keyboard support and focus management.

```jsx
import { AccessibleButton } from '@/utils/responsive';

<AccessibleButton
  variant="primary"
  size="md"
  onClick={handleClick}
  ariaLabel="Create new item"
  isLoading={isSubmitting}
>
  Create
</AccessibleButton>
```

### AccessibleModal Component

Modal with focus trap and escape key handling.

```jsx
import { AccessibleModal } from '@/utils/responsive';

<AccessibleModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
>
  {/* Modal content */}
</AccessibleModal>
```

### useKeyboardShortcut Hook

Add keyboard shortcuts.

```jsx
import { useKeyboardShortcut } from '@/utils/responsive';

function MyComponent() {
  useKeyboardShortcut('s', () => {
    // Handle Ctrl+S
    saveForm();
  }, true);

  return <form>{/* ... */}</form>;
}
```

### ARIA Live Regions

For dynamic content announcements.

```jsx
import { useLiveRegion } from '@/utils/responsive';

function MyComponent() {
  const [message, setMessage] = React.useState('');
  const liveRegion = useLiveRegion(message, 'polite');

  return <div ref={liveRegion} role="status" aria-live="polite" />;
}
```

### SkipNavigation Component

Allow keyboard users to skip to main content.

```jsx
import { SkipNavigation } from '@/utils/responsive';

<>
  <SkipNavigation />
  <Header />
  <main id="main-content">{/* Page content */}</main>
</>
```

---

## CSS Utilities

### Available CSS Classes

**Forms:**
- `.form` - Form wrapper
- `.form-field` - Field container
- `.form-field-label` - Label styling
- `.form-field-input` - Input styling
- `.form-field-input--error` - Error state
- `.form-field-error` - Error message
- `.form-field-help` - Help text

**Buttons:**
- `.btn` - Base button
- `.btn-primary` - Primary variant
- `.btn-secondary` - Secondary variant
- `.btn-danger` - Danger variant
- `.btn-sm`, `.btn-lg` - Size variants

**Cards:**
- `.card` - Card container
- `.card-header` - Card header
- `.card-body` - Card body
- `.card-footer` - Card footer

**Tables:**
- `.table` - Table styling
- `.table-container` - Responsive wrapper

**Utilities:**
- `.sr-only` - Screen reader only (hide visually)
- `.container` - Max-width container with responsive padding

---

## Best Practices

### 1. Form Validation

Always validate on both change and submit:

```jsx
// Validate on blur to catch errors early
onBlur={form.handleBlur}
// Only show errors for touched fields
isTouched={form.touched.fieldName}
```

### 2. Loading States

Always provide feedback for async operations:

```jsx
if (isLoading) return <SkeletonTable />;
if (error) return <ErrorState onRetry={refetch} />;
if (data.length === 0) return <EmptyState />;
```

### 3. Mobile-First Design

Always design for mobile first, then enhance for larger screens:

```jsx
// Mobile layout by default
// Then override with responsive utilities
<div className="flex flex-col md:flex-row lg:grid lg:grid-cols-3">
```

### 4. Accessibility

Always include:
- Proper labels for form fields
- ARIA attributes for dynamic content
- Keyboard navigation support
- Color contrast compliance (WCAG AA)

### 5. Performance

- Lazy load images
- Use pagination for large datasets
- Memoize expensive components with React.memo
- Use useCallback for event handlers

---

## Testing

### Test Form Validation

```jsx
test('shows validation error for empty email', async () => {
  const { getByText } = render(<LoginForm />);
  const submitButton = getByText('Login');

  await userEvent.click(submitButton);

  expect(getByText('Email is required')).toBeInTheDocument();
});
```

### Test Accessibility

```jsx
test('button has accessible name', () => {
  const { getByRole } = render(
    <AccessibleButton ariaLabel="Create item">Create</AccessibleButton>
  );

  expect(getByRole('button', { name: /create/i })).toBeInTheDocument();
});
```

---

## Migration Guide

To migrate existing components to use new improvements:

1. **Replace form handling:**
   - ❌ Old: Manual state management
   - ✅ New: useForm hook

2. **Add loading states:**
   - ❌ Old: No feedback
   - ✅ New: Spinner + SkeletonTable + EmptyState

3. **Add pagination:**
   - ❌ Old: Display all items
   - ✅ New: PaginatedTable component

4. **Add responsive design:**
   - ❌ Old: Desktop-only layout
   - ✅ New: useResponsive + responsive classes

5. **Improve accessibility:**
   - ❌ Old: Basic HTML
   - ✅ New: AccessibleButton, ARIA labels, keyboard support

---

## Related Documentation

- [Validation Schema](./validation.md)
- [API Integration](./api.md)
- [CSS Customization](./styling.md)
- [Component Library](./components.md)
