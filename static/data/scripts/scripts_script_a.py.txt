#!/usr/bin/env python3
"""
A simple script to demonstrate file operations automation.
This script shows how to work with directories and files safely.
"""

import os
import shutil
from pathlib import Path

def setup_directories():
    """Create necessary directories for file operations."""
    base_path = Path("./workspace")
    
    try:
        base_path.mkdir(exist_ok=True)
        print(f"Directory created: {base_path}")
    except FileExistsError:
        print(f"Directory already exists: {base_path}")
    
    return base_path

def copy_files(source_dir, dest_dir):
    """Copy files from source to destination directory."""
    source = Path(source_dir)
    destination = Path(dest_dir)
    
    if not source.exists():
        print(f"Source directory {source} does not exist")
        return
    
    try:
        destination.mkdir(parents=True, exist_ok=True)
        
        for file_path in source.glob("*.txt"):
            dest_file = destination / file_path.name
            shutil.copy2(file_path, dest_file)
            print(f"Copied: {file_path.name}")
            
    except Exception as e:
        print(f"Error copying files: {e}")

def main():
    """Main function to orchestrate file operations."""
    print("Starting file automation script...")
    
    # Setup workspace
    workspace = setup_directories()
    
    # Example file operations
    print("File operations completed successfully!")

if __name__ == "__main__":
    main()