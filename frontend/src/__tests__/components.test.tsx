/**
 * Frontend Component Tests
 * Tests for new form, loading, pagination, and responsive utilities
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormField, Form } from '@/hooks/useForm';
import { Spinner, EmptyState, useToast, Toast } from '@/components/Loading';
import { usePagination, Pagination } from '@/components/Pagination';
import { useResponsive, AccessibleButton } from '@/utils/responsive';

// ============== FORM TESTS ==============

describe('useForm Hook', () => {
  it('should initialize with provided values', () => {
    let formValues;

    function TestComponent() {
      const form = useForm({
        initialValues: { email: 'test@example.com' },
        onSubmit: async () => {},
      });
      formValues = form.values;
      return null;
    }

    render(<TestComponent />);
    expect(formValues).toEqual({ email: 'test@example.com' });
  });

  it('should update field value on change', async () => {
    function TestComponent() {
      const form = useForm({
        initialValues: { email: '' },
        onSubmit: async () => {},
      });

      return (
        <input
          name="email"
          value={form.values.email}
          onChange={form.handleChange}
        />
      );
    }

    const { getByRole } = render(<TestComponent />);
    const input = getByRole('textbox') as HTMLInputElement;

    await userEvent.type(input, 'test@example.com');

    expect(input.value).toBe('test@example.com');
  });

  it('should call validate function on submit', async () => {
    const validate = jest.fn(() => []);
    const onSubmit = jest.fn();

    function TestComponent() {
      const form = useForm({
        initialValues: { email: '' },
        onSubmit,
        validate,
      });

      return (
        <form onSubmit={form.handleSubmit}>
          <button type="submit">Submit</button>
        </form>
      );
    }

    const { getByText } = render(<TestComponent />);

    await userEvent.click(getByText('Submit'));

    expect(validate).toHaveBeenCalled();
  });

  it('should set error if validation fails', async () => {
    function TestComponent() {
      const form = useForm({
        initialValues: { email: '' },
        onSubmit: async () => {},
        validate: (values) => {
          if (!values.email) {
            return [{ field: 'email', message: 'Email is required' }];
          }
          return [];
        },
      });

      return (
        <form onSubmit={form.handleSubmit}>
          <input name="email" value={form.values.email} onChange={form.handleChange} />
          <button type="submit">Submit</button>
        </form>
      );
    }

    const { getByText } = render(<TestComponent />);

    await userEvent.click(getByText('Submit'));

    await waitFor(() => {
      expect(getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('should reset form', async () => {
    function TestComponent() {
      const form = useForm({
        initialValues: { email: '' },
        onSubmit: async () => {},
      });

      return (
        <>
          <input
            name="email"
            value={form.values.email}
            onChange={form.handleChange}
          />
          <button onClick={form.resetForm}>Reset</button>
        </>
      );
    }

    const { getByRole, getByText } = render(<TestComponent />);
    const input = getByRole('textbox') as HTMLInputElement;

    await userEvent.type(input, 'test@example.com');
    expect(input.value).toBe('test@example.com');

    await userEvent.click(getByText('Reset'));

    expect(input.value).toBe('');
  });
});

describe('FormField Component', () => {
  it('should render label', () => {
    const { getByText } = render(
      <FormField
        label="Email"
        name="email"
        value=""
        onChange={() => {}}
        onBlur={() => {}}
      />
    );

    expect(getByText('Email')).toBeInTheDocument();
  });

  it('should show required asterisk', () => {
    const { getByText } = render(
      <FormField
        label="Email"
        name="email"
        required
        value=""
        onChange={() => {}}
        onBlur={() => {}}
      />
    );

    expect(getByText('*')).toBeInTheDocument();
  });

  it('should display error when touched', () => {
    const { getByText } = render(
      <FormField
        label="Email"
        name="email"
        error="Email is required"
        isTouched={true}
        value=""
        onChange={() => {}}
        onBlur={() => {}}
      />
    );

    expect(getByText('Email is required')).toBeInTheDocument();
  });

  it('should not display error when not touched', () => {
    const { queryByText } = render(
      <FormField
        label="Email"
        name="email"
        error="Email is required"
        isTouched={false}
        value=""
        onChange={() => {}}
        onBlur={() => {}}
      />
    );

    expect(queryByText('Email is required')).not.toBeInTheDocument();
  });
});

// ============== LOADING TESTS ==============

describe('Spinner Component', () => {
  it('should render with default size', () => {
    const { getByRole } = render(<Spinner />);
    expect(getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('should render full screen spinner', () => {
    const { container } = render(<Spinner fullScreen={true} />);
    expect(container.querySelector('.fixed')).toBeInTheDocument();
  });
});

describe('EmptyState Component', () => {
  it('should display title and description', () => {
    const { getByText } = render(
      <EmptyState
        title="No items"
        description="Create your first item"
      />
    );

    expect(getByText('No items')).toBeInTheDocument();
    expect(getByText('Create your first item')).toBeInTheDocument();
  });

  it('should call action callback', async () => {
    const onClick = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="No items"
        action={{ label: 'Create', onClick }}
      />
    );

    await userEvent.click(getByText('Create'));
    expect(onClick).toHaveBeenCalled();
  });
});

describe('useToast Hook', () => {
  it('should add toast', () => {
    let toasts;

    function TestComponent() {
      const toast = useToast();
      toasts = toast.toasts;

      return (
        <button onClick={() => toast.success('Success!')}>
          Show Toast
        </button>
      );
    }

    const { getByText } = render(<TestComponent />);

    expect(toasts).toHaveLength(0);

    fireEvent.click(getByText('Show Toast'));

    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Success!');
  });
});

// ============== PAGINATION TESTS ==============

describe('usePagination Hook', () => {
  it('should calculate page info', () => {
    let pagination;

    function TestComponent() {
      pagination = usePagination({
        totalItems: 100,
        itemsPerPage: 10,
        currentPage: 1,
      });
      return null;
    }

    render(<TestComponent />);

    expect(pagination.totalPages).toBe(10);
    expect(pagination.page).toBe(1);
    expect(pagination.startIndex).toBe(0);
    expect(pagination.endIndex).toBe(10);
  });

  it('should navigate to next page', () => {
    let pagination;

    function TestComponent() {
      pagination = usePagination({
        totalItems: 100,
        itemsPerPage: 10,
      });

      return <button onClick={pagination.nextPage}>Next</button>;
    }

    const { getByText } = render(<TestComponent />);

    expect(pagination.page).toBe(1);

    fireEvent.click(getByText('Next'));

    expect(pagination.page).toBe(2);
  });

  it('should prevent navigation beyond boundaries', () => {
    let pagination;

    function TestComponent() {
      pagination = usePagination({
        totalItems: 100,
        itemsPerPage: 10,
      });

      return (
        <>
          <button onClick={pagination.prevPage}>Prev</button>
          <button onClick={pagination.nextPage}>Next</button>
        </>
      );
    }

    render(<TestComponent />);

    expect(pagination.canPreviousPage).toBe(false);

    // Go to last page
    pagination.goToPage(10);
    expect(pagination.canNextPage).toBe(false);
  });
});

describe('Pagination Component', () => {
  it('should render page numbers', () => {
    const { getByText } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={() => {}}
      />
    );

    expect(getByText('1')).toBeInTheDocument();
    expect(getByText('5')).toBeInTheDocument();
  });

  it('should call onPageChange when clicking page', async () => {
    const onPageChange = jest.fn();
    const { getByText } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );

    await userEvent.click(getByText('2'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should disable previous/next buttons appropriately', () => {
    const { getByRole } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        canPreviousPage={false}
        canNextPage={true}
        onPageChange={() => {}}
      />
    );

    const buttons = getByRole('button');
    // First button (Previous) should be disabled
    expect(buttons[0]).toBeDisabled();
  });
});

// ============== RESPONSIVE TESTS ==============

describe('AccessibleButton Component', () => {
  it('should render button with label', () => {
    const { getByRole } = render(<AccessibleButton>Click me</AccessibleButton>);
    expect(getByRole('button')).toBeInTheDocument();
  });

  it('should apply variant styles', () => {
    const { getByRole } = render(<AccessibleButton variant="danger">Delete</AccessibleButton>);
    const button = getByRole('button');
    expect(button).toHaveClass('bg-red-600');
  });

  it('should show loading state', () => {
    const { getByRole } = render(
      <AccessibleButton isLoading={true}>Submit</AccessibleButton>
    );

    expect(getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('should disable when loading', () => {
    const { getByRole } = render(
      <AccessibleButton isLoading={true}>Submit</AccessibleButton>
    );

    expect(getByRole('button')).toBeDisabled();
  });
});

// ============== INTEGRATION TESTS ==============

describe('Form + Validation Integration', () => {
  it('should show validation errors and allow correction', async () => {
    function TestForm() {
      const form = useForm({
        initialValues: { email: '', password: '' },
        onSubmit: async () => {
          // Success
        },
        validate: (values) => {
          const errors = [];
          if (!values.email) {
            errors.push({ field: 'email', message: 'Email required' });
          }
          if (!values.password) {
            errors.push({ field: 'password', message: 'Password required' });
          }
          return errors;
        },
      });

      return (
        <Form onSubmit={form.handleSubmit} errors={form.errors}>
          <FormField
            label="Email"
            name="email"
            value={form.values.email}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.getFieldError('email')}
            isTouched={form.touched.email}
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            value={form.values.password}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.getFieldError('password')}
            isTouched={form.touched.password}
          />
          <button type="submit">Submit</button>
        </Form>
      );
    }

    const { getByText, queryByText, getByDisplayValue } = render(<TestForm />);

    // Submit empty form
    await userEvent.click(getByText('Submit'));

    // Should show errors
    expect(getByText('Email required')).toBeInTheDocument();
    expect(getByText('Password required')).toBeInTheDocument();

    // Fill email
    const emailInput = getByDisplayValue('');
    await userEvent.type(emailInput, 'test@example.com');

    // Error should disappear after filling
    await waitFor(() => {
      expect(queryByText('Email required')).not.toBeInTheDocument();
    });
  });
});
