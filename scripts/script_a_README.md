# File Operations Automation

A beginner-friendly Python script that demonstrates safe file and directory operations using modern Python best practices.

## 📋 Overview

This script showcases fundamental file system operations that are commonly needed in automation tasks:
- Creating directories safely
- Copying files with error handling
- Using `pathlib` for cross-platform path handling
- Implementing proper exception handling

## 🎯 Key Features

- **Safe Directory Creation**: Uses `exist_ok=True` to avoid errors when directories already exist
- **Cross-Platform Compatibility**: Leverages `pathlib.Path` for OS-independent path handling
- **Error Handling**: Comprehensive try-catch blocks for robust operation
- **Modern Python**: Uses Python 3.6+ features and best practices

## 🔧 Functions Breakdown

### `setup_directories()`
Creates a workspace directory in the current location.

**Key Points:**
- Uses `Path("./workspace")` for relative path creation
- `mkdir(exist_ok=True)` prevents FileExistsError
- Returns the created path for further use

### `copy_files(source_dir, dest_dir)`
Copies all `.txt` files from source to destination directory.

**Features:**
- Validates source directory exists before proceeding
- Creates destination directory if it doesn't exist
- Uses `shutil.copy2()` to preserve file metadata
- Provides feedback on copied files

### `main()`
Orchestrates the file operations workflow.

**Purpose:**
- Entry point for the script
- Demonstrates function composition
- Provides user feedback

## 💡 Learning Objectives

After studying this script, you'll understand:

1. **Modern Path Handling**
   ```python
   # Old way (avoid)
   import os
   path = os.path.join("folder", "file.txt")
   
   # New way (recommended)
   from pathlib import Path
   path = Path("folder") / "file.txt"
   ```

2. **Safe Directory Operations**
   ```python
   # This won't crash if directory exists
   path.mkdir(exist_ok=True)
   
   # For nested directories
   path.mkdir(parents=True, exist_ok=True)
   ```

3. **Exception Handling Best Practices**
   ```python
   try:
       # Risky operation
       operation()
   except SpecificError as e:
       # Handle specific error
       print(f"Error: {e}")
   ```

## 🚀 Usage Examples

### Basic Usage
```bash
python script_a.py
```

### Customizing the Script
You can modify the script for your needs:

```python
# Change workspace location
base_path = Path("./my_custom_workspace")

# Copy different file types
for file_path in source.glob("*.pdf"):  # Copy PDF files instead
    # ... copy logic
```

## 🔍 Common Use Cases

This pattern is useful for:
- **Log File Management**: Organizing log files by date/type
- **Backup Operations**: Creating backup copies of important files
- **Data Processing**: Moving processed files to different folders
- **Project Setup**: Creating standard directory structures

## ⚠️ Important Notes

- Always test file operations with sample data first
- Be careful with file paths containing spaces or special characters
- Consider using absolute paths for production scripts
- Add logging for better debugging in complex scenarios

## 🔗 Related Concepts

- **File I/O in Python**: `open()`, `read()`, `write()`
- **Advanced Path Operations**: `glob()`, `iterdir()`, `resolve()`
- **Error Handling**: `try/except/finally`, custom exceptions
- **Command Line Arguments**: `argparse` for script parameters

## 📚 Next Steps

To extend this script, consider:
1. Adding command-line argument parsing
2. Implementing file filtering by date/size
3. Adding progress bars for large operations
4. Creating configuration files for settings
5. Adding unit tests for reliability

## 🏷️ Tags
`automation` `files` `beginner` `pathlib` `error-handling`