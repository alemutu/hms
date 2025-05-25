#!/bin/bash

# Start Supabase if not already running
if ! supabase status &>/dev/null; then
  echo "Starting Supabase..."
  supabase start
fi

# Generate TypeScript types from Supabase schema
echo "Generating TypeScript types..."
supabase gen types typescript --local > src/types/database.ts

# Start the development server
echo "Starting development server..."
npm run dev