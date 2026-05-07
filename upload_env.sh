#!/bin/bash
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  if [[ $key == \#* ]] || [[ -z $key ]]; then
    continue
  fi

  # Skip NEXT_PUBLIC_APP_URL to let Vercel handle it natively
  if [[ $key == "NEXT_PUBLIC_APP_URL" ]]; then
    continue
  fi

  # Remove quotes from value
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//')

  if [[ -n "$value" ]]; then
    echo "Adding $key..."
    echo -n "$value" | npx vercel env add "$key" production
  fi
done < .env.local
