'use client';

import * as React from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  required?: boolean;
  wrapperClassName?: string;
  children?: (renderProps: {
    value: T[FieldPath<T>];
    onChange: (value: T[FieldPath<T>]) => void;
    onBlur: () => void;
    invalid: boolean;
  }) => React.ReactNode;
}

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  wrapperClassName,
  children,
}: FormFieldProps<T>) {
  const id = React.useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const error = fieldState.error?.message;
        return (
          <div className={cn('space-y-1.5', wrapperClassName)}>
            <Label htmlFor={id}>
              {label}
              {required && <span className="ml-0.5 text-destructive">*</span>}
            </Label>
            {children ? (
              children({ value: field.value, onChange: field.onChange, onBlur: field.onBlur, invalid: Boolean(error) })
            ) : (
              <Input
                id={id}
                {...field}
                value={(field.value as string | number | undefined) ?? ''}
                aria-invalid={Boolean(error)}
              />
            )}
            {description && !error && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );
      }}
    />
  );
}

interface TextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'date' | 'password';
  wrapperClassName?: string;
  autoComplete?: string;
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  placeholder,
  type = 'text',
  wrapperClassName,
  autoComplete,
}: TextFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      required={required}
      wrapperClassName={wrapperClassName}
    >
      {({ value, onChange, onBlur, invalid }) => {
        const fieldProps = {
          placeholder,
          value: (value as string | number | undefined) ?? '',
          onChange,
          onBlur,
          'aria-invalid': invalid,
          autoComplete,
        };
        if (type === 'password') {
          return <PasswordInput {...fieldProps} />;
        }
        return <Input type={type} {...fieldProps} />;
      }}
    </FormField>
  );
}

interface TextAreaFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  wrapperClassName?: string;
}

export function TextAreaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  placeholder,
  rows = 4,
  wrapperClassName,
}: TextAreaFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      required={required}
      wrapperClassName={wrapperClassName}
    >
      {({ value, onChange, onBlur, invalid }) => (
        <Textarea
          rows={rows}
          placeholder={placeholder}
          value={(value as string | number | undefined) ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={invalid}
        />
      )}
    </FormField>
  );
}

interface SelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  wrapperClassName?: string;
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  placeholder,
  options,
  wrapperClassName,
}: SelectFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      required={required}
      wrapperClassName={wrapperClassName}
    >
      {({ value, onChange, invalid }) => (
        <Select
          value={(value as string | undefined) ?? ''}
          onValueChange={(v) => onChange(v as T[FieldPath<T>])}
        >
          <SelectTrigger aria-invalid={invalid}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
}
