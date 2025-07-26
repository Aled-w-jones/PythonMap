#!/usr/bin/env python3
"""
ArcGIS Utilities - Comprehensive Connection and Certificate Management

A unified utility for managing ArcGIS connections with robust certificate handling,
performance monitoring, and enterprise-grade logging.
"""

import ssl
import socket
import os
import logging
import time
import sys
import getpass
from typing import Optional, Any
from pathlib import Path
from functools import wraps
from datetime import datetime

import requests
import certifi

# Optional Windows Credential Manager support
try:
    import keyring
    KEYRING_AVAILABLE = True
except ImportError:
    KEYRING_AVAILABLE = False


class SimpleLogger:
    """
    A simple, focused logger for ArcGIS operations.
    Provides both console and file logging with timing information.
    """
    
    def __init__(self, name: str = "arcgis_utils", log_file: Optional[str] = None, level: str = "INFO"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, level.upper()))
        
        # Clear any existing handlers
        self.logger.handlers.clear()
        
        # Create formatter with timestamp
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
        
        # File handler (optional)
        if log_file:
            try:
                file_handler = logging.FileHandler(log_file)
                file_handler.setFormatter(formatter)
                self.logger.addHandler(file_handler)
            except Exception as e:
                self.logger.warning(f"Could not create file handler: {e}")
    
    def debug(self, message: str):
        self.logger.debug(message)
    
    def info(self, message: str):
        self.logger.info(message)
    
    def warning(self, message: str):
        self.logger.warning(message)
    
    def error(self, message: str):
        self.logger.error(message)
    
    def critical(self, message: str):
        self.logger.critical(message)


def timed_function(func):
    """Decorator to time function execution with detailed logging."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        func_name = func.__name__
        
        # Get logger from first argument if it's a class instance
        logger = None
        if args and hasattr(args[0], 'logger'):
            logger = args[0].logger
        
        if logger:
            logger.info(f"Starting {func_name}...")
        
        try:
            result = func(*args, **kwargs)
            end_time = time.time()
            duration = end_time - start_time
            
            if logger:
                logger.info(f"Completed {func_name} in {duration:.2f} seconds")
            else:
                print(f"{func_name} completed in {duration:.2f} seconds")
            
            return result
        except Exception as e:
            end_time = time.time()
            duration = end_time - start_time
            
            if logger:
                logger.error(f"Failed {func_name} after {duration:.2f} seconds: {str(e)}")
            else:
                print(f"{func_name} failed after {duration:.2f} seconds: {str(e)}")
            raise
    
    return wrapper


class SecureCredentialManager:
    """
    Manages secure credential storage and retrieval using secure methods.
    Supports keyring (Windows Credential Manager) and secure prompts.
    """
    
    def __init__(self, logger: Optional['SimpleLogger'] = None):
        self.logger = logger or SimpleLogger("credential_manager")
    
    def get_credential(self, username: Optional[str] = None, service_name: str = "ArcGIS") -> tuple[Optional[str], Optional[str]]:
        """
        Get credentials using secure methods in order of preference:
        1. Windows Credential Manager (keyring) - recommended
        2. Secure prompt (getpass)
        
        Args:
            username: Optional username to retrieve password for
            service_name: Service name for credential storage
            
        Returns:
            tuple: (username, password) or (None, None) if not found
        """
        # Method 1: Windows Credential Manager via keyring (recommended)
        if KEYRING_AVAILABLE and username:
            try:
                stored_password = keyring.get_password(service_name, username)
                if stored_password:
                    self.logger.info(f"Retrieved credentials from keyring for user: {username}")
                    return username, stored_password
            except Exception as e:
                self.logger.warning(f"Failed to retrieve from keyring: {str(e)}")
        
        # Method 2: Secure prompt
        if username:
            self.logger.info("Prompting for password (secure input)")
            try:
                password = getpass.getpass(f"Enter password for {username}: ")
                return username, password
            except KeyboardInterrupt:
                self.logger.info("Password input cancelled by user")
                return None, None
        
        return None, None
    


class ArcGISCertificateManager:
    """Handles SSL certificate verification for ArcGIS portals."""
    
    def __init__(self, output_dir: str = "./certificates", logger: Optional[SimpleLogger] = None):
        self.output_dir = Path(output_dir)
        self.logger = logger or SimpleLogger("cert_manager")
        
    @timed_function
    def get_verified_certificate(self, url: str) -> Optional[str]:
        """
        Get certificate verification using standard Python certificate handling.
        
        Args:
            url: The portal URL to verify certificates for
            
        Returns:
            Optional[str]: Path to certificate bundle if successful, None if verification fails
        """
        try:
            # Extract domain from URL
            domain = url.replace("https://", "").replace("http://", "").split('/')[0]
            self.logger.debug(f"Getting certificates for: {domain}")
            
            # Set up certificate store path
            cert_store_path = self.output_dir / "certificates"
            cert_store_path.mkdir(parents=True, exist_ok=True)
            
            # Try verification with certifi's certificates
            try:
                certifi_path = certifi.where()
                self.logger.debug(f"Certifi file exists: {os.path.exists(certifi_path)}")
                
                response = requests.get(f"https://{domain}", 
                                    verify=certifi_path, 
                                    timeout=10)
                self.logger.info("Certificate verification successful")
                return certifi_path
                
            except requests.exceptions.SSLError as ssl_err:
                self.logger.error(f"Certificate verification failed: {str(ssl_err)}")
                return None
                
        except Exception as e:
            self.logger.error(f"Error during certificate verification: {str(e)}")
            return None


class ArcGISConnectionManager:
    """
    Manages connections to ArcGIS portals with intelligent certificate handling.
    
    Supports multiple connection methods with robust error handling and 
    performance monitoring.
    """
    
    def __init__(self, logger: Optional[SimpleLogger] = None):
        self.logger = logger or SimpleLogger("connection_manager")
        self.cert_manager = ArcGISCertificateManager(logger=self.logger)
        self.credential_manager = SecureCredentialManager(logger=self.logger)
        
    def _validate_connection(self, gis) -> bool:
        """
        Validate that a GIS connection is functional.
        
        Args:
            gis: The GIS connection object to validate
            
        Returns:
            bool: True if connection is valid and functional
        """
        try:
            if hasattr(gis, 'users') and hasattr(gis.users, 'me'):
                user_info = gis.users.me
                self.logger.info(f"Connection validated for user: {user_info.username}")
                return True
            return False
        except Exception as e:
            self.logger.error(f"Connection validation failed: {str(e)}")
            return False
    
    @timed_function
    def connect_to_portal(self, url: Optional[str] = None, 
                         username: Optional[str] = None,
                         password: Optional[str] = None, 
                         profile: Optional[str] = None,
                         verify_cert: bool = True,
                         use_secure_credentials: bool = True) -> Any:
        """
        Connect to ArcGIS Enterprise or ArcGIS Online with comprehensive error handling.
        
        Args:
            url: Portal URL (optional for ArcGIS Online)
            username: Username for authentication (if None, will use secure credential retrieval)
            password: Password for authentication (if None, will use secure credential retrieval)
            profile: Profile name for authentication
            verify_cert: Whether to verify SSL certificates
            use_secure_credentials: Whether to use secure credential retrieval methods
            
        Returns:
            GIS connection object or None if connection fails
        """
        try:
            # Import arcgis module
            from arcgis.gis import GIS
            
            # Handle secure credential retrieval
            if use_secure_credentials and not profile:
                if not username or not password:
                    self.logger.info("Using secure credential retrieval")
                    secure_username, secure_password = self.credential_manager.get_credential(username)
                    if secure_username and secure_password:
                        username = secure_username
                        password = secure_password
                    elif not username:
                        self.logger.warning("No credentials available - will attempt default profile connection")
            
            # Initialize connection parameters
            gis_kwargs = {}
            
            # Handle certificate verification
            if verify_cert and url:
                cert_path = self.cert_manager.get_verified_certificate(url)
                if cert_path:
                    self.logger.info(f"Using certificate bundle: {cert_path}")
                    # Try modern ca_bundles parameter first (ArcGIS Pro 3.5+)
                    gis_kwargs['ca_bundles'] = cert_path
                    gis_kwargs['verify_cert'] = True
                else:
                    self.logger.warning("Certificate verification failed, using system defaults")
                    gis_kwargs['verify_cert'] = True
            else:
                gis_kwargs['verify_cert'] = verify_cert
            
            # Attempt connection with primary strategy
            try:
                gis = self._attempt_connection(url, username, password, profile, gis_kwargs)
                if gis and self._validate_connection(gis):
                    return gis
                else:
                    raise Exception("Connection validation failed")
                    
            except Exception as e:
                error_str = str(e).lower()
                
                # Handle certificate-related errors
                if any(cert_error in error_str for cert_error in [
                    "certificate verify failed", "ssl error", "ssl certificate", "certificate_verify_failed"
                ]):
                    self.logger.warning("SSL certificate verification failed, trying with verify_cert=False...")
                    return self._retry_without_verification(url, username, password, profile)
                
                # Handle API version compatibility issues
                elif "ca_bundles" in error_str or "unexpected keyword argument" in error_str:
                    self.logger.warning("ca_bundles not supported, trying legacy approach...")
                    return self._retry_legacy_certificates(url, username, password, profile, gis_kwargs)
                
                else:
                    raise
                
        except Exception as e:
            self.logger.error(f"Failed to connect to ArcGIS portal: {str(e)}")
            return None
    
    def _attempt_connection(self, url: Optional[str], username: Optional[str], 
                          password: Optional[str], profile: Optional[str], 
                          gis_kwargs: dict) -> Any:
        """Attempt connection with given parameters."""
        from arcgis.gis import GIS
        
        if profile:
            gis = GIS(url, username, password, profile=profile, **gis_kwargs)
            self.logger.info(f"Connected using profile: {profile}")
        elif username and password:
            portal_url = url if url else "home"
            gis = GIS(portal_url, username, password, **gis_kwargs)
            self.logger.info(f"Connected as user: {username}")
        else:
            gis = GIS("home", **gis_kwargs)
            self.logger.info("Connected using default profile")
        
        return gis
    
    def _retry_without_verification(self, url: Optional[str], username: Optional[str], 
                                  password: Optional[str], profile: Optional[str]) -> Any:
        """Retry connection with SSL verification disabled."""
        from arcgis.gis import GIS
        
        retry_kwargs = {'verify_cert': False}
        
        try:
            gis = self._attempt_connection(url, username, password, profile, retry_kwargs)
            if gis and self._validate_connection(gis):
                self.logger.warning("Connected with SSL verification disabled - THIS IS NOT SECURE!")
                return gis
            else:
                raise Exception("Connection failed even with SSL verification disabled")
        except Exception as e:
            self.logger.error(f"Retry without verification failed: {str(e)}")
            return None
    
    def _retry_legacy_certificates(self, url: Optional[str], username: Optional[str], 
                                 password: Optional[str], profile: Optional[str], 
                                 original_kwargs: dict) -> Any:
        """Retry connection using legacy certificate approach."""
        from arcgis.gis import GIS
        
        fallback_kwargs = original_kwargs.copy()
        cert_path = fallback_kwargs.pop('ca_bundles', None)
        
        if cert_path:
            fallback_kwargs['verify_cert'] = cert_path
        
        try:
            gis = self._attempt_connection(url, username, password, profile, fallback_kwargs)
            if gis and self._validate_connection(gis):
                self.logger.info("Connected using legacy certificate approach")
                return gis
            else:
                raise Exception("Legacy certificate approach failed")
        except Exception as e:
            self.logger.error(f"Legacy certificate retry failed: {str(e)}")
            return None


class ArcGISUtils:
    """
    Main utility class combining certificate management and connection handling.
    Provides a simple interface for all ArcGIS connectivity needs.
    """
    
    def __init__(self, log_file: Optional[str] = None, log_level: str = "INFO"):
        # Initialize logger
        self.logger = SimpleLogger("arcgis_utils", log_file, log_level)
        
        # Initialize managers
        self.cert_manager = ArcGISCertificateManager(logger=self.logger)
        self.connection_manager = ArcGISConnectionManager(logger=self.logger)
        self.credential_manager = SecureCredentialManager(logger=self.logger)
        
        self.logger.info("ArcGIS Utils initialized")
    
    def verify_certificate(self, url: str) -> Optional[str]:
        """Verify SSL certificate for a given URL."""
        return self.cert_manager.get_verified_certificate(url)
    
    def connect(self, url: Optional[str] = None, username: Optional[str] = None,
                password: Optional[str] = None, profile: Optional[str] = None,
                verify_cert: bool = True, use_secure_credentials: bool = True) -> Any:
        """Connect to ArcGIS portal with full error handling and secure credential management."""
        return self.connection_manager.connect_to_portal(url, username, password, profile, verify_cert, use_secure_credentials)
    
    def get_stored_credentials(self, username: str, service_name: str = "ArcGIS") -> tuple[Optional[str], Optional[str]]:
        """Retrieve stored credentials from Windows Credential Manager."""
        return self.credential_manager.get_credential(username, service_name)
    
    def test_connection(self, url: str) -> bool:
        """Test if a connection to a portal URL is possible."""
        try:
            gis = self.connect(url=url)
            return gis is not None
        except Exception:
            return False


def main():
    """Example usage of the unified ArcGIS utilities with secure credentials."""
    
    # Initialize with file logging
    utils = ArcGISUtils(log_file="arcgis_utils.log", log_level="INFO")
    
    print("=== ArcGIS Utilities Demo (Secure Credentials) ===\n")
    
    # Example 1: Certificate verification
    print("1. Testing certificate verification...")
    cert_path = utils.verify_certificate("https://services.arcgis.com")
    if cert_path:
        print(f"   [SUCCESS] Certificate verified: {cert_path}")
    else:
        print("   [FAILED] Certificate verification failed")
    
    # Example 2: Windows Credential Manager availability check
    print("\n2. Windows Credential Manager Integration...")
    if KEYRING_AVAILABLE:
        print("   [SUCCESS] Windows Credential Manager available for secure credential retrieval")
    else:
        print("   [WARNING] Install 'keyring' package for Windows Credential Manager support")
    
    # Example 3: Connection with secure credential retrieval
    print("\n3. Testing ArcGIS Online connection (with secure credentials)...")
    try:
        # This will use secure credential retrieval methods:
        # 1. Windows Credential Manager (if keyring available)
        # 2. Default profile connection
        gis = utils.connect(use_secure_credentials=True)
        if gis:
            print(f"   [SUCCESS] Connected to: {gis.properties.portalHostname}")
            print(f"   User: {gis.users.me.username}")
        else:
            print("   [INFO] No credentials found - this is expected in demo mode")
    except Exception as e:
        print(f"   [INFO] Connection demo completed: {str(e)}")
    
    # Example 4: Test connection method
    print("\n4. Testing connection test method...")
    is_reachable = utils.test_connection("https://www.arcgis.com")
    print(f"   ArcGIS.com reachable: {is_reachable}")
    
    print("\n=== Demo Complete ===")
    print("Check 'arcgis_utils.log' for detailed logging information")
    print("\nFor production use:")
    print("- Pre-configure credentials in Windows Credential Manager (recommended), OR") 
    print("- The system will prompt securely for credentials when needed")
    print("\nTo manually store credentials in Windows Credential Manager:")
    print("  cmdkey /generic:ArcGIS /user:your_username /pass:your_password")


if __name__ == "__main__":
    main()