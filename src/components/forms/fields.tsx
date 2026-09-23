"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useFormErrors } from "./action-form";
import { cn } from "@/lib/utils";

type Base = { name: string; label: string; hint?: string; wrapperClassName?: string };

function Wrapper({ id, name, label, hint, wrapperClassName, required, children }: Base & { id: string; required?: boolean; children: ReactNode }) {
  const error = useFormErrors()[name];
  return (
    <div className={wrapperClassName}>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="ml-0.5 text-sky" aria-hidden> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="field-error" role="alert">{error}</p>
      ) : (
        hint && <p className="field-hint">{hint}</p>
      )}
    </div>
  );
}

export function TextField({ name, label, hint, wrapperClassName, className, required, ...rest }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const error = useFormErrors()[name];
  return (
    <Wrapper id={id} name={name} label={label} hint={hint} wrapperClassName={wrapperClassName} required={required}>
      <input id={id} name={name} required={required} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={cn("input", className)} {...rest} />
    </Wrapper>
  );
}

export function PasswordField({ name, label, hint, wrapperClassName, required, ...rest }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [show, setShow] = useState(false);
  const error = useFormErrors()[name];
  return (
    <Wrapper id={id} name={name} label={label} hint={hint} wrapperClassName={wrapperClassName} required={required}>
      <div className="relative">
        <input id={id} name={name} type={show ? "text" : "password"} required={required} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className="input pr-11" {...rest} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Ocultar senha" : "Mostrar senha"} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-steel transition hover:text-white">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Wrapper>
  );
}

export function TextArea({ name, label, hint, wrapperClassName, className, required, rows = 4, ...rest }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  const error = useFormErrors()[name];
  return (
    <Wrapper id={id} name={name} label={label} hint={hint} wrapperClassName={wrapperClassName} required={required}>
      <textarea id={id} name={name} rows={rows} required={required} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={cn("input resize-y", className)} {...rest} />
    </Wrapper>
  );
}

export function SelectField({
  name,
  label,
  hint,
  wrapperClassName,
  className,
  required,
  options,
  placeholder,
  ...rest
}: Base & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[]; placeholder?: string }) {
  const id = useId();
  const error = useFormErrors()[name];
  return (
    <Wrapper id={id} name={name} label={label} hint={hint} wrapperClassName={wrapperClassName} required={required}>
      <select id={id} name={name} required={required} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={cn("input", className)} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Wrapper>
  );
}

export function CheckboxField({ name, label, hint, defaultChecked, className }: { name: string; label: ReactNode; hint?: string; defaultChecked?: boolean; className?: string }) {
  const id = useId();
  const error = useFormErrors()[name];
  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm text-silver">
        <input id={id} type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-ink accent-neon" />
        <span>
          {label}
          {hint && <span className="field-hint block">{hint}</span>}
        </span>
      </label>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
