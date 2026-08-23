import React from 'react';

export const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
  'UTC',
];

interface Props {
  value: string;
  onChange: (tz: string) => void;
  className?: string;
}

export const TimezoneSelector: React.FC<Props> = ({ value, onChange, className = '' }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 ${className}`}
    >
      {!COMMON_TIMEZONES.includes(value) && value && (
        <option value={value}>{value} (Current)</option>
      )}
      {COMMON_TIMEZONES.map((tz) => (
        <option key={tz} value={tz}>
          {tz}
        </option>
      ))}
    </select>
  );
};
