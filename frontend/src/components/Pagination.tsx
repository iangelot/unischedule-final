import React from 'react';

/**
 * Pagination hook for managing paginated data
 */
interface PaginationParams {
  totalItems: number;
  itemsPerPage?: number;
  currentPage?: number;
}

export function usePagination({ totalItems, itemsPerPage = 10, currentPage = 1 }: PaginationParams) {
  const [page, setPage] = React.useState(currentPage);
  const pageSize = itemsPerPage;
  const totalPages = Math.ceil(totalItems / pageSize);

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const goToPage = (pageNum: number) => {
    const validPage = Math.max(1, Math.min(pageNum, totalPages));
    setPage(validPage);
  };

  const nextPage = () => goToPage(page + 1);
  const prevPage = () => goToPage(page - 1);

  return {
    page,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    canPreviousPage: page > 1,
    canNextPage: page < totalPages,
    goToPage,
    nextPage,
    prevPage,
  };
}

/**
 * Pagination UI component
 */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  canPreviousPage?: boolean;
  canNextPage?: boolean;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  canPreviousPage = currentPage > 1,
  canNextPage = currentPage < totalPages,
  isLoading = false,
}: PaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxButtons = 5;
    const halfButtons = Math.floor(maxButtons / 2);

    if (totalPages <= maxButtons) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show current page ± halfButtons pages
      let start = currentPage - halfButtons;
      let end = currentPage + halfButtons;

      if (start < 1) {
        end += 1 - start;
        start = 1;
      }
      if (end > totalPages) {
        start -= end - totalPages;
        end = totalPages;
      }

      // Add first page and ellipsis if needed
      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push('...');
        }
      }

      // Add page range
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add last page and ellipsis if needed
      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canPreviousPage || isLoading}
        className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        ← Previous
      </button>

      {/* Page numbers */}
      <div className="flex gap-1">
        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 py-2">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              disabled={isLoading}
              className={`px-3 py-2 rounded-lg border transition ${
                page === currentPage
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
              } disabled:opacity-50`}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canNextPage || isLoading}
        className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        Next →
      </button>

      {/* Page info */}
      <span className="text-sm text-gray-600 ml-4">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
}

/**
 * Items per page selector component
 */
interface ItemsPerPageProps {
  value: number;
  options?: number[];
  onChange: (itemsPerPage: number) => void;
}

export function ItemsPerPageSelector({
  value,
  options = [5, 10, 25, 50],
  onChange,
}: ItemsPerPageProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="items-per-page" className="text-sm text-gray-600">
        Show
      </label>
      <select
        id="items-per-page"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <span className="text-sm text-gray-600">items per page</span>
    </div>
  );
}

/**
 * Table with integrated pagination
 */
interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
}

interface PaginatedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  itemsPerPage?: number;
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export function PaginatedTable<T extends { id?: string; [key: string]: any }>({
  data,
  columns,
  itemsPerPage = 10,
  isLoading = false,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}: PaginatedTableProps<T>) {
  const pagination = usePagination({ totalItems: data.length, itemsPerPage });
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  const paginatedData = data.slice(pagination.startIndex, pagination.endIndex);

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedData.length) {
      onSelectionChange?.(selectedIds.filter((id) => !paginatedData.find((item) => item.id === id)));
    } else {
      onSelectionChange?.([
        ...selectedIds,
        ...paginatedData.filter((item) => !selectedIds.includes(item.id)).map((item) => item.id),
      ]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange?.([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && selectedIds.length === paginatedData.length}
                    onChange={handleSelectAll}
                    aria-label="Select all items on this page"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-900"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr
                  key={`${item.id}-${idx}`}
                  onClick={() => onRowClick?.(item)}
                  className={`border-b border-gray-200 hover:bg-gray-50 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleSelectRow(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${item.id}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 text-sm text-gray-900">
                      {col.render
                        ? col.render((item as any)[col.key as string], item)
                        : (item as any)[col.key as string]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <ItemsPerPageSelector value={itemsPerPage} onChange={setItemsPerPage} />
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={pagination.goToPage}
          canPreviousPage={pagination.canPreviousPage}
          canNextPage={pagination.canNextPage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
