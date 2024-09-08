#!/bin/sh

# Output file name
output_file="concatenated_code.txt"

# Function to process a directory
process_directory() {
    dir="$1"
    route="$2"

    # Loop through all files and directories in the current directory
    for item in "$dir"/*; do
        if [ -f "$item" ]; then
            # If it's a file, add it to the output file
            # echo "Route: $route" >> "$output_file"
            echo "File: $item" >> "$output_file"
            echo "----------------------" >> "$output_file"
            cat "$item" >> "$output_file"
            echo "\n\n" >> "$output_file"
        elif [ -d "$item" ]; then
            # If it's a directory, process it recursively
            process_directory "$item" "$route/$(basename "$item")"
        fi
    done
}

# Clear or create the output file
> "$output_file"

# Process src directory
if [ -d "./src" ]; then
    process_directory "./src" "/src"
else
    echo "Warning: src directory not found" >&2
fi

# Process prisma directory
if [ -d "./prisma" ]; then
    process_directory "./prisma" "/prisma"
else
    echo "Warning: prisma directory not found" >&2
fi

echo "All files from src and prisma directories have been concatenated into $output_file"