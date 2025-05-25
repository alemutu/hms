#!/bin/bash

# Initialize Supabase project
echo "Initializing Supabase project..."
supabase init

# Start Supabase services
echo "Starting Supabase services..."
supabase start

# Apply migrations
echo "Applying migrations..."
supabase db reset

echo "Database initialization complete!"
echo "You can now connect to your Supabase instance at http://localhost:54323"