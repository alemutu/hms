import React, { useState, useEffect, useRef } from 'react';
import { Command } from 'cmdk';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LabTestOption, searchTests } from '@/data/labTests';

interface TestAutocompleteProps {
  value: string;
  onChange: (value: string, test: LabTestOption) => void;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  department?: 'laboratory' | 'radiology'; // Add department prop to filter tests
}

export function TestAutocomplete({
  value,
  onChange,
  onOpenChange,
  placeholder = "Search for a test...",
  department // Optional department filter
}: TestAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<LabTestOption[]>([]);
  const commandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query) {
      // Get all matching tests
      const allResults = searchTests(query);
      
      // Filter by department if specified
      const filteredResults = department 
        ? allResults.filter(test => test.department === department)
        : allResults;
        
      setOptions(filteredResults);
    } else {
      setOptions([]);
    }
  }, [query, department]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  // Stop propagation on all click events within the component
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Command className="relative" ref={commandRef} onClick={handleClick}>
      <div className="flex items-center border rounded-lg bg-white">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search className="w-4 h-4" />
        </div>
        <Command.Input
          value={query}
          onValueChange={setQuery}
          className="flex h-10 w-full rounded-lg border-0 bg-transparent pl-9 pr-3 text-sm outline-none placeholder:text-gray-500 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={placeholder}
          onClick={(e) => e.stopPropagation()}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenChange(!open);
          }}
          className="px-2 hover:bg-gray-100 rounded-r-lg h-10 border-l"
        >
          <ChevronsUpDown className="h-4 w-4 text-gray-500" />
        </button>
      </div>
      {open && options.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
          <Command.List>
            {options.map((test) => (
              <Command.Item
                key={test.id}
                value={test.id}
                onSelect={() => {
                  onChange(test.name, test);
                  setQuery("");
                  handleOpenChange(false);
                }}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-gray-100 data-[selected]:bg-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex-1">
                  <p className="font-medium">{test.name}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{test.category} • {test.department}</p>
                    <p className="text-xs font-medium text-gray-700">KES {test.price?.toLocaleString() || '0'}</p>
                  </div>
                </div>
                {value === test.name && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </Command.Item>
            ))}
          </Command.List>
        </div>
      )}
    </Command>
  );
}