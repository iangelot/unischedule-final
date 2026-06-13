/**
 * Improved Courses Component with:
 * - Form validation
 * - Loading states
 * - Pagination
 * - Mobile responsiveness
 * - Accessibility
 */

import React from 'react';
import { useForm, FormField, Form } from '@/hooks/useForm';
import { Spinner, SkeletonTable, EmptyState, useToast, Toast } from '@/components/Loading';
import { PaginatedTable, usePagination, Pagination } from '@/components/Pagination';
import { useResponsive, AccessibleButton, AccessibleModal } from '@/utils/responsive';
import { api } from '@/api';

interface Course {
  id: string;
  code: string;
  title: string;
  semester: number;
  credits: number;
}

/**
 * Course validation schema
 */
function validateCourse(values: Record<string, any>) {
  const errors = [];

  if (!values.code?.trim()) {
    errors.push({ field: 'code', message: 'Course code is required' });
  } else if (values.code.length > 10) {
    errors.push({ field: 'code', message: 'Course code must be 10 characters or less' });
  }

  if (!values.title?.trim()) {
    errors.push({ field: 'title', message: 'Course title is required' });
  }

  if (!values.semester) {
    errors.push({ field: 'semester', message: 'Semester is required' });
  }

  if (values.credits && (values.credits < 0 || values.credits > 10)) {
    errors.push({ field: 'credits', message: 'Credits must be between 0 and 10' });
  }

  return errors;
}

export function CoursesPage() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { toasts, removeToast, success, error } = useToast();

  const form = useForm({
    initialValues: {
      code: '',
      title: '',
      semester: '1',
      credits: '',
    },
    onSubmit: async (values) => {
      try {
        const newCourse = await api.createCourse({
          code: values.code.trim(),
          title: values.title.trim(),
          semester: parseInt(values.semester, 10),
          credits: values.credits ? parseInt(values.credits, 10) : undefined,
        });

        setCourses((prev) => [newCourse, ...prev]);
        success('Course created successfully');
        form.resetForm();
        setIsModalOpen(false);
      } catch (err: any) {
        error(err.message || 'Failed to create course');
      }
    },
    validate: validateCourse,
  });

  const pagination = usePagination({
    totalItems: courses.length,
    itemsPerPage,
  });

  // Fetch courses on mount
  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoadingCourses(true);
        const data = await api.getCourses();
        setCourses(data);
      } catch (err: any) {
        error('Failed to load courses');
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (value: string) => <span className="font-mono text-sm">{value}</span>,
    },
    {
      key: 'title',
      label: 'Title',
    },
    {
      key: 'semester',
      label: 'Semester',
      render: (value: number) => `Semester ${value}`,
    },
    ...(isDesktop
      ? [
          {
            key: 'credits',
            label: 'Credits',
            render: (value: number) => value || '-',
          },
        ]
      : []),
  ];

  return (
    <div className="container py-6 md:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600">Manage university courses</p>
        </div>
        <AccessibleButton
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          ariaLabel="Create new course"
        >
          {isMobile ? '+ Add' : '+ Add Course'}
        </AccessibleButton>
      </div>

      {/* Loading state */}
      {isLoadingCourses ? (
        <div className="space-y-4">
          <SkeletonTable rows={5} columns={isMobile ? 2 : 4} />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Get started by creating your first course"
          action={{ label: 'Create Course', onClick: () => setIsModalOpen(true) }}
        />
      ) : (
        <>
          {/* Courses table */}
          <div className="card mb-4">
            <PaginatedTable<Course>
              data={courses}
              columns={columns}
              itemsPerPage={itemsPerPage}
              isLoading={isLoadingCourses}
              onRowClick={(course) => {
                // Navigate to course detail
                console.log('View course:', course.id);
              }}
            />
          </div>

          {/* Pagination stats */}
          <div className="text-sm text-gray-600 text-center py-2">
            Showing {pagination.startIndex + 1} to {pagination.endIndex} of {courses.length} courses
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      <AccessibleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          form.resetForm();
        }}
        title="Create New Course"
      >
        <Form onSubmit={form.handleSubmit} isSubmitting={form.isSubmitting} errors={form.errors}>
          <FormField
            label="Course Code"
            name="code"
            placeholder="e.g., CS101"
            required
            error={form.getFieldError('code')}
            isTouched={form.touched.code}
            value={form.values.code}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            help="Unique identifier for the course"
          />

          <FormField
            label="Course Title"
            name="title"
            placeholder="e.g., Introduction to Programming"
            required
            error={form.getFieldError('title')}
            isTouched={form.touched.title}
            value={form.values.title}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
          />

          <FormField
            label="Semester"
            name="semester"
            type="select"
            required
            error={form.getFieldError('semester')}
            isTouched={form.touched.semester}
            value={form.values.semester}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
          >
            <option value="">Select semester...</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </FormField>

          <FormField
            label="Credits"
            name="credits"
            type="number"
            placeholder="e.g., 3"
            error={form.getFieldError('credits')}
            isTouched={form.touched.credits}
            value={form.values.credits}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            help="Optional: number of credit hours"
          />

          {/* Form actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <AccessibleButton
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                form.resetForm();
              }}
              disabled={form.isSubmitting}
            >
              Cancel
            </AccessibleButton>
            <AccessibleButton
              type="submit"
              variant="primary"
              isLoading={form.isSubmitting}
              disabled={form.isSubmitting}
            >
              Create Course
            </AccessibleButton>
          </div>
        </Form>
      </AccessibleModal>

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-40">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default CoursesPage;
