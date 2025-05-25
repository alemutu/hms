#!/bin/bash

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Please install it first."
    exit 1
fi

# Start Supabase
echo "Starting Supabase..."
supabase start

# Apply migrations
echo "Applying migrations..."
supabase db reset

# Generate TypeScript types
echo "Generating TypeScript types..."
supabase gen types typescript --local > src/types/database.ts

echo "Supabase setup complete!"
echo "You can now connect to your Supabase instance at http://localhost:54323"