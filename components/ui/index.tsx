'use client'

import {
  forwardRef, ButtonHTMLAttributes, InputHTMLAttributes,
  TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode,
} from 'react';

// ─── Button ───────────────────────────────────────────────────────────────────

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type BtnSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?:    BtnSize;
  loading?: boolean;
  icon?:    ReactNode;
}

const BTN_BASE = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none select-none';
const BTN_V: Record<BtnVariant, string> = {
  primary:   'bg-[#C4922A] text-white hover:bg-[#A07520] active:scale-[0.98]',
  secondary: 'bg-[#F0EDE6] text-[#0F0D0A] border border-[#D4C9B8] hover:border-[#8B7355]',
  ghost:     'text-[#8B7355] hover:bg-[#F0EDE6] hover:text-[#0F0D0A]',
  danger:    'bg-red-600 text-white hover:bg-red-700',
};
const BTN_S: Record<BtnSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${BTN_BASE} ${BTN_V[variant]} ${BTN_S[size]} ${className}`}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'>  {
  label?:  string;
  error?:  string;
  hint?:   string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className = '', id, ...rest }, ref) => {
    const iid = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={iid} className="text-sm font-medium text-[#0F0D0A]">{label}</label>}
        <div className="relative flex items-center">
          {prefix && <span className="absolute left-3 text-[#8B7355] pointer-events-none">{prefix}</span>}
          <input
            ref={ref} id={iid}
            className={`w-full h-10 rounded-lg border bg-white text-sm placeholder:text-[#B5A48A] transition-all
              ${prefix ? 'pl-9' : 'pl-3'} ${suffix ? 'pr-9' : 'pr-3'}
              ${error
                ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                : 'border-[#D4C9B8] focus:border-[#C4922A] focus:ring-2 focus:ring-[#C4922A]/20'
              } ${className}`}
            {...rest}
          />
          {suffix && <span className="absolute right-3 text-[#8B7355]">{suffix}</span>}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-[#8B7355]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...rest }, ref) => {
    const tid = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={tid} className="text-sm font-medium text-[#0F0D0A]">{label}</label>}
        <textarea
          ref={ref} id={tid}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm placeholder:text-[#B5A48A] resize-none transition-all
            ${error
              ? 'border-red-400 focus:ring-2 focus:ring-red-200'
              : 'border-[#D4C9B8] focus:border-[#C4922A] focus:ring-2 focus:ring-[#C4922A]/20'
            } ${className}`}
          {...rest}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string;
  error?:   string;
  options:  { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', id, ...rest }, ref) => {
    const sid = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={sid} className="text-sm font-medium text-[#0F0D0A]">{label}</label>}
        <select
          ref={ref} id={sid}
          className={`w-full h-10 rounded-lg border px-3 bg-white text-sm transition-all
            ${error
              ? 'border-red-400'
              : 'border-[#D4C9B8] focus:border-[#C4922A] focus:ring-2 focus:ring-[#C4922A]/20'
            } ${className}`}
          {...rest}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'gold' | 'green' | 'gray' | 'red' | 'blue' | 'stone' | 'orange' | 'purple';
const BADGE_V: Record<BadgeVariant, string> = {
  gold:   'bg-[#C4922A]/10 text-[#C4922A] border-[#C4922A]/20',
  green:  'bg-green-50 text-green-700 border-green-200',
  red:    'bg-red-50 text-red-600 border-red-200',
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  stone:  'bg-[#F0EDE6] text-[#8B7355] border-[#D4C9B8]',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  gray:   'bg-gray-50 text-gray-700 border-gray-200'
};

export function Badge({
  variant = 'stone', children, className = '',
}: { variant?: BadgeVariant; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${BADGE_V[variant]} ${className}`}>
      {children}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  children, className = '', padding = true,
}: { children: ReactNode; className?: string; padding?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border border-[#D4C9B8]/60 shadow-[0_1px_4px_rgba(15,13,10,0.06)] ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

export function StatCard({
  label, value, delta, deltaUp, icon, loading,
}: {
  label:    string;
  value:    string | number;
  delta?:   string;
  deltaUp?: boolean;
  icon?:    ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-wider">{label}</p>
          {loading
            ? <div className="shimmer h-8 w-24 rounded mt-2" />
            : <p className="font-display text-3xl font-light text-[#0F0D0A] mt-1">{value}</p>
          }
          {delta && (
            <p className={`text-xs mt-1.5 font-medium ${deltaUp ? 'text-green-600' : 'text-red-500'}`}>
              {deltaUp ? '↑' : '↓'} {delta}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-[#C4922A]/10 flex items-center justify-center text-[#C4922A] shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────

type AlertVariant = 'error' | 'warning' | 'success' | 'info';
const ALERT_V: Record<AlertVariant, string> = {
  error:   'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-orange-50 border-orange-200 text-orange-700',
  success: 'bg-green-50 border-green-200 text-green-700',
  info:    'bg-blue-50 border-blue-200 text-blue-700',
};

export function Alert({
  variant = 'info', children, className = '',
}: { variant?: AlertVariant; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${ALERT_V[variant]} ${className}`}>
      {children}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

interface TableColumn<T> {
  key:      string;
  label:    string;
  render?:  (row: T) => ReactNode;
  width?:   string;
}

export function Table<T>({
  columns, data, loading, keyFn, emptyMessage = 'Aucune donnée',
}: {
  columns:       TableColumn<T>[];
  data:          T[];
  loading?:      boolean;
  keyFn:         (row: T) => string;
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#D4C9B8]/60">
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-[#8B7355] uppercase tracking-wider ${col.width ?? ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D4C9B8]/30">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="shimmer h-4 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            : data.length === 0
              ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-[#8B7355]">
                      {emptyMessage}
                    </td>
                  </tr>
                )
              : data.map(row => (
                  <tr key={keyFn(row)} className="hover:bg-[#FAFAF8] transition-colors">
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3 text-[#0F0D0A]">
                        {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
          }
        </tbody>
      </table>
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

export function PageHeader({
  title, subtitle, actions,
}: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-[#0F0D0A]">{title}</h1>
        {subtitle && <p className="text-sm text-[#8B7355] mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 ml-4">{actions}</div>}
    </div>
  );
}

// ─── Empty ────────────────────────────────────────────────────────────────────

export function Empty({
  title, description, icon, action,
}: { title: string; description?: string; icon?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      {icon && <span className="text-4xl text-[#D4C9B8] mb-3">{icon}</span>}
      <p className="font-medium text-[#0F0D0A]">{title}</p>
      {description && <p className="text-sm text-[#8B7355] mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size];
  return (
    <div className={`${s} border-2 border-[#C4922A] border-t-transparent rounded-full animate-spin`} />
  );
}
