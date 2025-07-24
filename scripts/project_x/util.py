"""
Data Analysis Utilities for Pandas

Helper functions for data manipulation and cleaning using Pandas.
Provides common operations for data preprocessing and analysis.
"""

import pandas as pd
import numpy as np
from typing import Optional, List, Dict, Any

def clean_data(df: pd.DataFrame, 
               drop_nulls: bool = True,
               fill_value: Optional[Any] = None) -> pd.DataFrame:
    """
    Clean a pandas DataFrame by handling missing values and duplicates.
    
    Args:
        df: Input DataFrame to clean
        drop_nulls: Whether to drop rows with null values
        fill_value: Value to fill nulls with (if drop_nulls is False)
    
    Returns:
        Cleaned DataFrame
    """
    cleaned_df = df.copy()
    
    # Remove duplicates
    cleaned_df = cleaned_df.drop_duplicates()
    
    # Handle missing values
    if drop_nulls:
        cleaned_df = cleaned_df.dropna()
    elif fill_value is not None:
        cleaned_df = cleaned_df.fillna(fill_value)
    
    return cleaned_df

def analyze_trends(df: pd.DataFrame, 
                  date_column: str,
                  value_column: str) -> Dict[str, Any]:
    """
    Analyze trends in time series data.
    
    Args:
        df: DataFrame with time series data
        date_column: Name of the date column
        value_column: Name of the value column to analyze
    
    Returns:
        Dictionary with trend analysis results
    """
    # Ensure date column is datetime
    df[date_column] = pd.to_datetime(df[date_column])
    
    # Sort by date
    df_sorted = df.sort_values(date_column)
    
    # Calculate basic statistics
    results = {
        'mean': df_sorted[value_column].mean(),
        'median': df_sorted[value_column].median(),
        'std': df_sorted[value_column].std(),
        'min': df_sorted[value_column].min(),
        'max': df_sorted[value_column].max(),
        'trend': 'increasing' if df_sorted[value_column].iloc[-1] > df_sorted[value_column].iloc[0] else 'decreasing'
    }
    
    return results

def export_summary(df: pd.DataFrame, filename: str) -> None:
    """
    Export DataFrame summary statistics to CSV.
    
    Args:
        df: DataFrame to summarize
        filename: Output filename for the summary
    """
    summary = df.describe()
    summary.to_csv(filename)
    print(f"Summary exported to {filename}")

def filter_outliers(df: pd.DataFrame, 
                   column: str,
                   method: str = 'iqr') -> pd.DataFrame:
    """
    Filter outliers from a DataFrame column.
    
    Args:
        df: Input DataFrame
        column: Column name to filter outliers from
        method: Method to use ('iqr' or 'zscore')
    
    Returns:
        DataFrame with outliers removed
    """
    if method == 'iqr':
        Q1 = df[column].quantile(0.25)
        Q3 = df[column].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        return df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]
    
    elif method == 'zscore':
        z_scores = np.abs((df[column] - df[column].mean()) / df[column].std())
        return df[z_scores < 3]
    
    else:
        raise ValueError("Method must be 'iqr' or 'zscore'")