#!/usr/bin/env python3
"""
Advanced Data Analytics Suite
A comprehensive toolkit for data analysis, visualization, and machine learning
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import accuracy_score, mean_squared_error, r2_score, classification_report
import warnings
warnings.filterwarnings('ignore')

# Set style for better plots
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")


class DataAnalyzer:
    """Main class for comprehensive data analysis."""
    
    def __init__(self, data_path=None, data=None):
        """Initialize with either a file path or pandas DataFrame."""
        if data_path:
            self.load_data(data_path)
        elif data is not None:
            self.df = data
        else:
            self.df = None
        
        self.encoders = {}
        self.scalers = {}
        self.models = {}
    
    def load_data(self, file_path):
        """Load data from various file formats."""
        try:
            if file_path.endswith('.csv'):
                self.df = pd.read_csv(file_path)
            elif file_path.endswith(('.xlsx', '.xls')):
                self.df = pd.read_excel(file_path)
            elif file_path.endswith('.json'):
                self.df = pd.read_json(file_path)
            elif file_path.endswith('.parquet'):
                self.df = pd.read_parquet(file_path)
            else:
                raise ValueError("Unsupported file format")
            
            print(f"✅ Data loaded successfully: {self.df.shape[0]} rows, {self.df.shape[1]} columns")
            
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            raise
    
    def explore_data(self):
        """Perform comprehensive exploratory data analysis."""
        if self.df is None:
            print("❌ No data loaded!")
            return
        
        print("📊 DATASET OVERVIEW")
        print("=" * 50)
        print(f"Shape: {self.df.shape}")
        print(f"Memory usage: {self.df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
        
        print("\n📋 COLUMN INFORMATION")
        print("=" * 30)
        print(self.df.info())
        
        print("\n📈 STATISTICAL SUMMARY")
        print("=" * 25)
        print(self.df.describe())
        
        print("\n🔍 MISSING VALUES")
        print("=" * 20)
        missing = self.df.isnull().sum()
        missing_percent = (missing / len(self.df)) * 100
        missing_table = pd.DataFrame({
            'Missing Count': missing,
            'Percentage': missing_percent.round(2)
        })
        print(missing_table[missing_table['Missing Count'] > 0])
        
        print("\n🎯 DATA TYPES")
        print("=" * 15)
        for dtype in self.df.dtypes.unique():
            columns = self.df.select_dtypes(include=[dtype]).columns.tolist()
            print(f"{dtype}: {len(columns)} columns")
            if len(columns) <= 10:
                print(f"  → {', '.join(columns)}")
            else:
                print(f"  → {', '.join(columns[:10])}... (+{len(columns)-10} more)")
    
    def clean_data(self, strategy='auto'):
        """Clean the dataset using various strategies."""
        if self.df is None:
            print("❌ No data loaded!")
            return
        
        original_shape = self.df.shape
        print(f"🧹 Starting data cleaning... Original shape: {original_shape}")
        
        # Remove duplicate rows
        duplicates = self.df.duplicated().sum()
        if duplicates > 0:
            self.df = self.df.drop_duplicates()
            print(f"  ✅ Removed {duplicates} duplicate rows")
        
        if strategy == 'auto':
            # Handle missing values automatically
            for column in self.df.columns:
                missing_count = self.df[column].isnull().sum()
                if missing_count > 0:
                    if self.df[column].dtype in ['int64', 'float64']:
                        # Numeric: fill with median
                        self.df[column].fillna(self.df[column].median(), inplace=True)
                        print(f"  ✅ Filled {missing_count} missing values in '{column}' with median")
                    else:
                        # Categorical: fill with mode
                        mode_value = self.df[column].mode()[0] if not self.df[column].mode().empty else 'Unknown'
                        self.df[column].fillna(mode_value, inplace=True)
                        print(f"  ✅ Filled {missing_count} missing values in '{column}' with mode")
        
        # Remove columns with too many missing values (>80%)
        high_missing = []
        for column in self.df.columns:
            missing_ratio = self.df[column].isnull().sum() / len(self.df)
            if missing_ratio > 0.8:
                high_missing.append(column)
        
        if high_missing:
            self.df = self.df.drop(columns=high_missing)
            print(f"  ✅ Removed {len(high_missing)} columns with >80% missing values")
        
        print(f"🎉 Cleaning complete! New shape: {self.df.shape}")
        print(f"   Removed {original_shape[0] - self.df.shape[0]} rows and {original_shape[1] - self.df.shape[1]} columns")
    
    def visualize_data(self, save_plots=False):
        """Create comprehensive visualizations."""
        if self.df is None:
            print("❌ No data loaded!")
            return
        
        numeric_columns = self.df.select_dtypes(include=[np.number]).columns
        categorical_columns = self.df.select_dtypes(include=['object']).columns
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('📊 Data Overview Dashboard', fontsize=16, fontweight='bold')
        
        # 1. Correlation heatmap
        if len(numeric_columns) > 1:
            correlation_matrix = self.df[numeric_columns].corr()
            sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0, 
                       square=True, ax=axes[0, 0])
            axes[0, 0].set_title('🔥 Correlation Heatmap')
        else:
            axes[0, 0].text(0.5, 0.5, 'Not enough numeric\ncolumns for correlation', 
                          ha='center', va='center', transform=axes[0, 0].transAxes)
            axes[0, 0].set_title('🔥 Correlation Heatmap')
        
        # 2. Missing values pattern
        missing_data = self.df.isnull().sum()
        missing_data = missing_data[missing_data > 0].sort_values(ascending=False)
        if not missing_data.empty:
            missing_data.plot(kind='bar', ax=axes[0, 1], color='salmon')
            axes[0, 1].set_title('🕳️ Missing Values by Column')
            axes[0, 1].tick_params(axis='x', rotation=45)
        else:
            axes[0, 1].text(0.5, 0.5, 'No missing values\nfound! 🎉', 
                          ha='center', va='center', transform=axes[0, 1].transAxes)
            axes[0, 1].set_title('🕳️ Missing Values by Column')
        
        # 3. Distribution of first numeric column
        if len(numeric_columns) > 0:
            self.df[numeric_columns[0]].hist(bins=30, ax=axes[1, 0], alpha=0.7, color='skyblue')
            axes[1, 0].set_title(f'📊 Distribution: {numeric_columns[0]}')
            axes[1, 0].set_xlabel(numeric_columns[0])
            axes[1, 0].set_ylabel('Frequency')
        else:
            axes[1, 0].text(0.5, 0.5, 'No numeric columns\nfound', 
                          ha='center', va='center', transform=axes[1, 0].transAxes)
            axes[1, 0].set_title('📊 Distribution Plot')
        
        # 4. Category counts for first categorical column
        if len(categorical_columns) > 0:
            top_categories = self.df[categorical_columns[0]].value_counts().head(10)
            top_categories.plot(kind='bar', ax=axes[1, 1], color='lightgreen')
            axes[1, 1].set_title(f'📈 Top Categories: {categorical_columns[0]}')
            axes[1, 1].tick_params(axis='x', rotation=45)
        else:
            axes[1, 1].text(0.5, 0.5, 'No categorical\ncolumns found', 
                          ha='center', va='center', transform=axes[1, 1].transAxes)
            axes[1, 1].set_title('📈 Category Counts')
        
        plt.tight_layout()
        
        if save_plots:
            plt.savefig('data_overview_dashboard.png', dpi=300, bbox_inches='tight')
            print("📸 Dashboard saved as 'data_overview_dashboard.png'")
        
        plt.show()
    
    def build_model(self, target_column, model_type='auto', test_size=0.2):
        """Build and train a machine learning model."""
        if self.df is None:
            print("❌ No data loaded!")
            return
        
        if target_column not in self.df.columns:
            print(f"❌ Target column '{target_column}' not found!")
            return
        
        print(f"🤖 Building model to predict '{target_column}'...")
        
        # Prepare features and target
        X = self.df.drop(columns=[target_column])
        y = self.df[target_column]
        
        # Handle categorical variables
        for column in X.select_dtypes(include=['object']).columns:
            if column not in self.encoders:
                self.encoders[column] = LabelEncoder()
                X[column] = self.encoders[column].fit_transform(X[column].astype(str))
            else:
                X[column] = self.encoders[column].transform(X[column].astype(str))
        
        # Handle target variable if categorical
        is_classification = y.dtype == 'object' or y.nunique() < 10
        if is_classification and y.dtype == 'object':
            if 'target' not in self.encoders:
                self.encoders['target'] = LabelEncoder()
                y = self.encoders['target'].fit_transform(y.astype(str))
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y if is_classification else None
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        self.scalers['features'] = scaler
        
        # Choose model
        if model_type == 'auto':
            if is_classification:
                model = RandomForestClassifier(n_estimators=100, random_state=42)
                model_name = "Random Forest Classifier"
            else:
                model = RandomForestRegressor(n_estimators=100, random_state=42)
                model_name = "Random Forest Regressor"
        else:
            model = model_type
            model_name = str(type(model).__name__)
        
        # Train model
        print(f"🏋️ Training {model_name}...")
        model.fit(X_train_scaled, y_train)
        
        # Make predictions
        y_pred = model.predict(X_test_scaled)
        
        # Evaluate model
        print(f"\n🎯 MODEL EVALUATION")
        print("=" * 25)
        
        if is_classification:
            accuracy = accuracy_score(y_test, y_pred)
            print(f"Accuracy: {accuracy:.4f}")
            print("\nClassification Report:")
            print(classification_report(y_test, y_pred))
        else:
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            print(f"Mean Squared Error: {mse:.4f}")
            print(f"R² Score: {r2:.4f}")
        
        # Store model
        self.models[target_column] = {
            'model': model,
            'is_classification': is_classification,
            'features': X.columns.tolist(),
            'test_score': accuracy if is_classification else r2
        }
        
        print(f"✅ Model successfully trained and stored!")
        return model
    
    def predict(self, target_column, new_data):
        """Make predictions on new data."""
        if target_column not in self.models:
            print(f"❌ No trained model found for '{target_column}'!")
            return None
        
        model_info = self.models[target_column]
        model = model_info['model']
        
        # Prepare new data
        X_new = new_data.copy()
        
        # Handle categorical variables
        for column in X_new.select_dtypes(include=['object']).columns:
            if column in self.encoders:
                X_new[column] = self.encoders[column].transform(X_new[column].astype(str))
        
        # Scale features
        X_new_scaled = self.scalers['features'].transform(X_new)
        
        # Make predictions
        predictions = model.predict(X_new_scaled)
        
        # Decode predictions if classification
        if model_info['is_classification'] and 'target' in self.encoders:
            predictions = self.encoders['target'].inverse_transform(predictions)
        
        return predictions


def create_sample_dataset():
    """Create a sample dataset for demonstration."""
    np.random.seed(42)
    
    # Create synthetic customer data
    n_samples = 1000
    
    data = {
        'age': np.random.randint(18, 80, n_samples),
        'income': np.random.normal(50000, 20000, n_samples).astype(int),
        'education_years': np.random.randint(8, 20, n_samples),
        'experience_years': np.random.randint(0, 40, n_samples),
        'city_size': np.random.choice(['Small', 'Medium', 'Large'], n_samples),
        'department': np.random.choice(['IT', 'Sales', 'Marketing', 'HR', 'Finance'], n_samples),
    }
    
    # Create target variable based on features
    satisfaction_scores = (
        0.3 * (data['income'] / 100000) +
        0.2 * (data['education_years'] / 20) +
        0.1 * (data['experience_years'] / 40) +
        0.2 * np.random.random(n_samples) +
        0.2
    )
    
    data['satisfaction'] = np.random.choice(
        ['Low', 'Medium', 'High'], 
        n_samples, 
        p=[0.3, 0.4, 0.3]
    )
    
    # Add some missing values for realism
    missing_indices = np.random.choice(n_samples, int(0.05 * n_samples), replace=False)
    for idx in missing_indices:
        col = np.random.choice(list(data.keys()))
        if isinstance(data[col], np.ndarray):
            data[col][idx] = np.nan
    
    return pd.DataFrame(data)


if __name__ == "__main__":
    print("🚀 Advanced Data Analytics Suite")
    print("=" * 40)
    
    # Create sample data
    print("📊 Creating sample dataset...")
    sample_data = create_sample_dataset()
    
    # Initialize analyzer
    analyzer = DataAnalyzer(data=sample_data)
    
    # Perform analysis
    print("\n🔍 Exploring data...")
    analyzer.explore_data()
    
    print("\n🧹 Cleaning data...")
    analyzer.clean_data()
    
    print("\n📊 Creating visualizations...")
    analyzer.visualize_data(save_plots=True)
    
    print("\n🤖 Building predictive model...")
    model = analyzer.build_model('satisfaction')
    
    print("\n🎉 Analysis complete! Check the generated plots and model results.")
    print("\n💡 Pro tip: You can use this analyzer with your own data by:")
    print("   analyzer = DataAnalyzer('your_data.csv')")