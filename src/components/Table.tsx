import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import './components.css';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  sortBy,
  sortOrder,
  onSort,
  isLoading = false,
  emptyMessage = "No items found."
}: TableProps<T>) {
  return (
    <div className="table-container">
      <div className="table-wrapper">
        <table className="table-element">
          <thead className="table-head">
            <tr>
              {columns.map((col, index) => {
                const isSorted = sortBy && (col.sortKey === sortBy || (col.accessor && String(col.accessor) === sortBy));
                return (
                  <th key={index} style={{ width: col.width }}>
                    {col.sortable && onSort ? (
                      <button 
                        type="button"
                        className="table-sort-btn"
                        onClick={() => onSort(col.sortKey || String(col.accessor || ''))}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {col.header}
                        <span style={{ display: 'inline-flex', opacity: isSorted ? 1 : 0.4 }}>
                          {isSorted ? (
                            sortOrder === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                          ) : (
                            <ChevronsUpDown size={13} />
                          )}
                        </span>
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="pulse" style={{ color: 'var(--text-secondary)' }}>Loading records...</div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr key={keyExtractor(row)} className="table-row">
                  {columns.map((col, cIndex) => (
                    <td key={cIndex} className="table-cell">
                      {col.render 
                        ? col.render(row) 
                        : col.accessor 
                          ? String(row[col.accessor] ?? '')
                          : null
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default Table;
