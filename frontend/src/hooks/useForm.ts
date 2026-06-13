import React from 'react';

interface ValidationError {
  field: string;
  message: string;
}

export interface FormState {
  values: Record<string, any>;
  errors: ValidationError[];
  isSubmitting: boolean;
  isValidating: boolean;
  touched: Record<string, boolean>;
}

interface UseFormProps {
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  validate?: (values: Record<string, any>) => ValidationError[];
}

/**
 * Custom React hook for form management with validation
 * Handles state, errors, touched fields, and submission
 */
export function useForm({ initialValues, onSubmit, validate }: UseFormProps) {
  const [state, setState] = React.useState<FormState>({
    values: initialValues,
    errors: [],
    isSubmitting: false,
    isValidating: false,
    touched: {},
  });

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

      setState((prev) => ({
        ...prev,
        values: {
          ...prev.values,
          [name]: fieldValue,
        },
        touched: {
          ...prev.touched,
          [name]: true,
        },
      }));
    },
    []
  );

  const handleBlur = React.useCallback((e: React.FocusEvent<any>) => {
    const { name } = e.target;
    setState((prev) => ({
      ...prev,
      touched: {
        ...prev.touched,
        [name]: true,
      },
    }));

    // Validate on blur if validator provided
    if (validate) {
      setState((prev) => ({
        ...prev,
        isValidating: true,
      }));

      const errors = validate(state.values);

      setState((prev) => ({
        ...prev,
        errors,
        isValidating: false,
      }));
    }
  }, [validate, state.values]);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate before submission
      if (validate) {
        const errors = validate(state.values);
        if (errors.length > 0) {
          setState((prev) => ({
            ...prev,
            errors,
          }));
          return;
        }
      }

      setState((prev) => ({
        ...prev,
        isSubmitting: true,
        errors: [],
      }));

      try {
        await onSubmit(state.values);
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
        }));
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          errors: [
            {
              field: 'form',
              message: err.message || 'An error occurred',
            },
          ],
        }));
      }
    },
    [state.values, onSubmit, validate]
  );

  const setFieldValue = React.useCallback((name: string, value: any) => {
    setState((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [name]: value,
      },
    }));
  }, []);

  const setFieldError = React.useCallback((name: string, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: [...prev.errors.filter((e) => e.field !== name), { field: name, message: error }],
    }));
  }, []);

  const resetForm = React.useCallback(() => {
    setState({
      values: initialValues,
      errors: [],
      isSubmitting: false,
      isValidating: false,
      touched: {},
    });
  }, [initialValues]);

  return {
    values: state.values,
    errors: state.errors,
    isSubmitting: state.isSubmitting,
    isValidating: state.isValidating,
    touched: state.touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    getFieldError: (fieldName: string) =>
      state.errors.find((e) => e.field === fieldName)?.message || '',
    getFieldMeta: (fieldName: string) => ({
      value: state.values[fieldName],
      error: state.errors.find((e) => e.field === fieldName)?.message || '',
      isTouched: state.touched[fieldName] || false,
    }),
  };
}

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  isTouched?: boolean;
  isDisabled?: boolean;
  value?: any;
  onChange: (e: React.ChangeEvent<any>) => void;
  onBlur: (e: React.FocusEvent<any>) => void;
  help?: string;
  children?: React.ReactNode;
}

/**
 * Reusable form field component with error display
 */
export function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  required,
  error,
  isTouched,
  isDisabled,
  value,
  onChange,
  onBlur,
  help,
  children,
}: FormFieldProps) {
  const hasError = Boolean(error) && isTouched;

  return (
    <div className="form-field">
      <label htmlFor={name} className="form-field-label">
        {label}
        {required && <span className="form-field-required">*</span>}
      </label>

      {type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          disabled={isDisabled}
          className={`form-field-input ${hasError ? 'form-field-input--error' : ''}`}
        >
          {children}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          placeholder={placeholder}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          disabled={isDisabled}
          className={`form-field-input form-field-textarea ${hasError ? 'form-field-input--error' : ''}`}
        />
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          placeholder={placeholder}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          disabled={isDisabled}
          className={`form-field-input ${hasError ? 'form-field-input--error' : ''}`}
        />
      )}

      {hasError && <div className="form-field-error">{error}</div>}
      {help && !hasError && <div className="form-field-help">{help}</div>}
    </div>
  );
}

interface FormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
  errors?: ValidationError[];
  className?: string;
}

/**
 * Form wrapper component
 */
export function Form({ children, onSubmit, isSubmitting, errors, className }: FormProps) {
  const formErrors = errors?.filter((e) => e.field === 'form') || [];

  return (
    <form onSubmit={onSubmit} className={`form ${className || ''}`} noValidate>
      {formErrors.length > 0 && (
        <div className="form-errors" role="alert">
          <div className="form-errors-title">Please fix the following errors:</div>
          <ul className="form-errors-list">
            {formErrors.map((error, idx) => (
              <li key={idx}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {children}
    </form>
  );
}
