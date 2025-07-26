# ArcGIS Utilities - Unified Connection and Certificate Management

A comprehensive, production-ready utility for managing ArcGIS connections with enterprise-grade logging, performance monitoring, and robust error handling.

## Overview

This unified script combines certificate verification and connection management into a single, cohesive solution for ArcGIS development. It addresses the complex challenges of working with ArcGIS in enterprise environments, conda installations, and varying API versions.

## Key Features

### 🔐 **Certificate Management**
- Automatic SSL certificate verification and validation
- Conda environment certificate path resolution
- Enterprise certificate handling for corporate networks

### 🔌 **Connection Management** 
- Multiple authentication methods (credentials, profiles, default)
- Intelligent fallback strategies for different ArcGIS API versions
- Automatic retry logic for certificate and compatibility issues

### 📊 **Performance Monitoring**
- Built-in timing decorators for all major operations
- Performance logging with detailed execution metrics
- Connection validation and health checks

### 📝 **Enterprise Logging**
- Professional logging with timestamps and levels
- Dual output (console + file) with configurable levels
- Structured error reporting and debugging information

## Installation

```bash
pip install arcgis requests certifi keyring
```

**Note**: `keyring` is optional but recommended for Windows Credential Manager integration.

## Quick Start

### Simple Usage (Secure Credentials)
```python
from arcgis_utils import ArcGISUtils

# Initialize with logging
utils = ArcGISUtils(log_file="gis_operations.log")

# Connect to ArcGIS Online (uses secure credential retrieval)
gis = utils.connect(url="my.gis.com/portal", username="service_account")
if gis:
    print(f"Connected as: {gis.users.me.username}")
```

### Enterprise Portal Connection (Secure Methods)
```python
# Method 1: Using Windows Credential Manager (recommended)
# Assumes credentials are already stored in Windows Credential Manager
gis = utils.connect(
    url="https://your-portal.domain.com/portal",
    username="service_account"  # Password retrieved automatically from credential manager
)

# Method 2: Secure prompt (interactive)
gis = utils.connect(
    url="https://your-portal.domain.com/portal",
    username="service_account"  # Will prompt securely for password
)
```

### Certificate Verification
```python
# Test certificate before connecting
cert_path = utils.verify_certificate("https://your-portal.com")
if cert_path:
    print(f"Certificates valid: {cert_path}")
    gis = utils.connect(url="https://your-portal.com/portal")
```

## Secure Credential Management

### Overview
The utility supports multiple secure credential storage and retrieval methods, eliminating the need for hardcoded passwords:

1. **Windows Credential Manager** (Best practice - secure OS-level storage)
2. **Secure Interactive Prompts** (Best for development and one-time use)

### Method 1: Windows Credential Manager (Recommended)
```python
from arcgis_utils import ArcGISUtils

utils = ArcGISUtils()

# Use pre-stored credentials (no password in code)
# Credentials must be pre-configured in Windows Credential Manager
gis = utils.connect(
    url="https://production-portal.com/portal", 
    username="service_account"  # Password retrieved automatically
)

# Retrieve stored credentials for verification (optional)
username, password = utils.get_stored_credentials("service_account", "Production_Portal")
if username:
    print(f"Found credentials for user: {username}")
```

### Using Windows Credential Manager GUI (One-time Setup)
1. Open **Control Panel** → **Credential Manager**
2. Click **Add a generic credential**
3. Set **Internet or network address**: `ArcGIS` (or custom service name like `ArcGIS_Production`)
4. Set **User name**: Your ArcGIS username
5. Set **Password**: Your ArcGIS password
6. Click **OK**

**Once configured**, the Python utility will automatically retrieve and use these credentials without any passwords in your code.

## Advanced Usage

### Custom Logging Configuration
```python
# Initialize with specific log level and file
utils = ArcGISUtils(
    log_file="/var/log/gis/operations.log",
    log_level="DEBUG"  # DEBUG, INFO, WARNING, ERROR, CRITICAL
)
```

### Connection Testing
```python
# Test if a portal is reachable
portals = [
    "https://services.arcgis.com",
    "https://your-internal-portal.com/portal"
]

for portal in portals:
    if utils.test_connection(portal):
        print(f"✓ {portal} is reachable")
    else:
        print(f"✗ {portal} is not accessible")
```

### Profile-Based Authentication
```python
# Use ArcGIS Pro profiles
gis = utils.connect(
    url="https://your-portal.com/portal",
    profile="production_profile"
)
```

## Error Handling Strategies

The utility implements multiple fallback strategies:

### 1. Certificate Verification Fallbacks
```
Primary:    certifi certificate bundle
Fallback:   System certificate validation
Emergency:  SSL verification disabled (with warnings)
```

### 2. API Compatibility Handling
```
Modern:     ca_bundles parameter (ArcGIS Pro 3.5+)
Legacy:     verify_cert with certificate path
Fallback:   Basic verification parameters
```

### 3. Connection Method Priorities
```
1st:  Profile-based authentication
2nd:  Username/password credentials  
3rd:  Default system profile
```

## Performance Monitoring

All major operations include timing information:

```python
# Example log output:
# 2024-01-15 10:30:15 - arcgis_utils - INFO - Starting get_verified_certificate...
# 2024-01-15 10:30:16 - arcgis_utils - INFO - Certificate verification successful
# 2024-01-15 10:30:16 - arcgis_utils - INFO - Completed get_verified_certificate in 0.45 seconds
# 2024-01-15 10:30:16 - arcgis_utils - INFO - Starting connect_to_portal...
# 2024-01-15 10:30:18 - arcgis_utils - INFO - Connected as user: service_account
# 2024-01-15 10:30:18 - arcgis_utils - INFO - Completed connect_to_portal in 1.23 seconds
```

## Enterprise Use Cases

### Automated Workflows (Secure)
```python
#!/usr/bin/env python3
"""Daily GIS data processing workflow - Secure credential handling"""

from arcgis_utils import ArcGISUtils
import sys
import json

def load_config(config_path="gis_config.json"):
    """Load configuration from JSON file"""
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Config file {config_path} not found")
        return None

def main():
    # Load configuration
    config = load_config()
    if not config:
        sys.exit(1)
    
    utils = ArcGISUtils(
        log_file=config.get("log_file", "daily_process.log"),
        log_level=config.get("log_level", "INFO")
    )
    
    # Connect using pre-configured credentials from Windows Credential Manager
    # Username comes from config, password retrieved securely
    gis = utils.connect(
        url=config["portal_url"],
        username=config["service_account"]  # Password retrieved automatically
    )
    
    if not gis:
        utils.logger.critical("Failed to connect to GIS portal - check credentials")
        sys.exit(1)
    
    # Proceed with data processing...
    utils.logger.info("Starting daily data processing workflow")
    utils.logger.info(f"Connected as: {gis.users.me.username}")
    # Your GIS operations here...

if __name__ == "__main__":
    main()
```

**Uses `gis_config.json` (included in this directory):**
```json
{
    "portal_url": "https://gis.company.com/portal",
    "service_account": "automation_user",
    "service_name": "ArcGIS_Production",
    "log_level": "INFO",
    "log_file": "/var/log/gis/daily_process.log"
}
```


### Multi-Environment Deployment (Secure)
```python
def get_gis_connection(environment="production"):
    """Get GIS connection for specific environment using config file"""
    
    # Load config from file
    with open("gis_config.json", 'r') as f:
        config = json.load(f)
    
    env_config = config["environments"][environment]
    utils = ArcGISUtils(
        log_file=f"gis_{environment}.log",
        log_level=env_config["log_level"]
    )
    
    # Uses secure credential retrieval with username from config
    return utils.connect(
        url=env_config["portal_url"],
        username=env_config["service_account"]  # Password retrieved from credential manager
    )
```

## Why This Unified Approach?

### 1. **Enhanced Security**
- **No hardcoded passwords**: Eliminates credentials in source code
- **Secure storage**: Windows Credential Manager and secure prompts only
- **Audit trail**: Comprehensive logging of authentication attempts
- **Secure by default**: Automatic credential retrieval without code changes

### 2. **Reduced Complexity**
- Single import instead of multiple utility scripts
- Consistent API across all GIS operations
- Unified error handling and logging
- Automatic fallback strategies

### 3. **Production Ready**
- Comprehensive logging for troubleshooting
- Performance metrics for optimization
- Robust error handling for reliability
- Enterprise credential management

### 4. **Enterprise Features**
- Multi-environment support with separate credential stores
- Health monitoring capabilities
- Automated workflow integration
- Windows domain integration via Credential Manager

### 5. **Maintainability**
- Single codebase for all GIS connectivity needs
- Consistent naming and patterns
- Centralized configuration and logging
- Easy migration from insecure legacy code

### 6. **Compliance & Best Practices**
- **Security compliance**: Meets enterprise security requirements
- **Password rotation**: Easy credential updates without code changes
- **Access control**: Leverages OS-level credential protection
- **Audit requirements**: Detailed logging for security audits

## Security Benefits Summary

| Traditional Approach | ArcGIS Utils (Secure) |
|---------------------|----------------------|
| `password="hardcoded"` | Windows Credential Manager |
| Credentials in source code | Secure OS-level storage |
| No audit trail | Comprehensive logging |
| Manual credential management | Automatic secure retrieval |
| Single point of failure | Multiple fallback methods |
| Version control exposure | Zero credential exposure |

This unified utility transforms scattered, insecure GIS connection code into a professional, secure, maintainable solution that meets enterprise security standards.