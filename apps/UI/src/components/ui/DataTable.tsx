import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  empty?: ReactNode;
}

export function DataTable<T extends Record<string, any>>({ columns, rows, empty }: DataTableProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card card-neumorf">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="transition-colors hover:bg-accent/50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 font-sans text-sm">
                  {col.render ? col.render(row) : row[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
