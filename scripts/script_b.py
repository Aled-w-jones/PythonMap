#!/usr/bin/env python3
"""
Web Scraper and Data Processor
A comprehensive script for web scraping and data analysis
"""

import requests
import json
import csv
from datetime import datetime
from bs4 import BeautifulSoup
import pandas as pd


class WebScraper:
    """A simple web scraper class for extracting data from websites."""
    
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def fetch_page(self, endpoint):
        """Fetch a single page and return the response."""
        try:
            url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            print(f"Error fetching {url}: {e}")
            return None
    
    def extract_links(self, html_content):
        """Extract all links from HTML content."""
        soup = BeautifulSoup(html_content, 'html.parser')
        links = []
        
        for link in soup.find_all('a', href=True):
            href = link['href']
            text = link.get_text(strip=True)
            links.append({
                'url': href,
                'text': text,
                'absolute_url': requests.compat.urljoin(self.base_url, href)
            })
        
        return links
    
    def extract_text_content(self, html_content):
        """Extract clean text content from HTML."""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text and clean it up
        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        return text


class DataProcessor:
    """Process and analyze scraped data."""
    
    def __init__(self):
        self.data = []
    
    def add_data(self, data_dict):
        """Add a data entry with timestamp."""
        data_dict['timestamp'] = datetime.now().isoformat()
        self.data.append(data_dict)
    
    def save_to_json(self, filename):
        """Save data to JSON file."""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)
        print(f"Data saved to {filename}")
    
    def save_to_csv(self, filename):
        """Save data to CSV file."""
        if not self.data:
            print("No data to save")
            return
        
        df = pd.DataFrame(self.data)
        df.to_csv(filename, index=False, encoding='utf-8')
        print(f"Data saved to {filename}")
    
    def get_statistics(self):
        """Get basic statistics about the collected data."""
        if not self.data:
            return "No data available"
        
        stats = {
            'total_entries': len(self.data),
            'date_range': {
                'first': min(entry['timestamp'] for entry in self.data),
                'last': max(entry['timestamp'] for entry in self.data)
            }
        }
        
        return stats


def analyze_website(url, max_pages=5):
    """Main function to analyze a website."""
    print(f"Starting analysis of: {url}")
    
    # Initialize scraper and data processor
    scraper = WebScraper(url)
    processor = DataProcessor()
    
    # Fetch the main page
    response = scraper.fetch_page('/')
    if not response:
        print("Failed to fetch main page")
        return
    
    # Extract and process main page data
    links = scraper.extract_links(response.text)
    text_content = scraper.extract_text_content(response.text)
    
    # Add main page data
    processor.add_data({
        'page_url': url,
        'title': 'Main Page',
        'word_count': len(text_content.split()),
        'link_count': len(links),
        'status_code': response.status_code
    })
    
    # Process additional pages
    processed_count = 1
    for link in links[:max_pages-1]:  # Process up to max_pages total
        if processed_count >= max_pages:
            break
            
        if link['url'].startswith('http'):  # External links
            continue
            
        response = scraper.fetch_page(link['url'])
        if response:
            text_content = scraper.extract_text_content(response.text)
            processor.add_data({
                'page_url': link['absolute_url'],
                'title': link['text'] or 'Untitled',
                'word_count': len(text_content.split()),
                'link_count': len(scraper.extract_links(response.text)),
                'status_code': response.status_code
            })
            processed_count += 1
    
    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    processor.save_to_json(f'scrape_results_{timestamp}.json')
    processor.save_to_csv(f'scrape_results_{timestamp}.csv')
    
    # Display statistics
    stats = processor.get_statistics()
    print("\n=== Analysis Complete ===")
    print(f"Total pages analyzed: {stats['total_entries']}")
    print(f"Analysis period: {stats['date_range']['first']} to {stats['date_range']['last']}")
    
    return processor.data


if __name__ == "__main__":
    # Example usage
    test_urls = [
        "https://httpbin.org",  # Great for testing
        "https://jsonplaceholder.typicode.com"  # API testing site
    ]
    
    for url in test_urls:
        print(f"\n{'='*50}")
        print(f"Analyzing: {url}")
        print(f"{'='*50}")
        
        try:
            results = analyze_website(url, max_pages=3)
            print(f"Successfully analyzed {len(results)} pages")
        except Exception as e:
            print(f"Error analyzing {url}: {e}")
        
        print("\nWaiting before next analysis...")
        import time
        time.sleep(2)  # Be respectful to servers
    
    print("\n🎉 All analyses complete!")