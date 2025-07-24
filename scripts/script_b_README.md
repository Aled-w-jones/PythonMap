# Web Scraper and Data Processor

A comprehensive Python script for web scraping, data extraction, and analysis. This tool provides a robust framework for collecting data from websites and processing it into various formats.

## 🎯 Purpose

This script was designed to help automate the collection and analysis of web data. It's particularly useful for:

- **Market Research**: Gathering competitive intelligence from websites
- **Content Analysis**: Extracting and analyzing text content from web pages
- **Link Analysis**: Understanding website structure and navigation patterns
- **Data Migration**: Converting web content to structured formats (JSON, CSV)

## 🚀 Key Features

### WebScraper Class
- **Smart HTTP Handling**: Built-in session management with proper headers
- **Error Resilience**: Comprehensive error handling for network issues
- **Content Extraction**: Clean text extraction with HTML parsing
- **Link Discovery**: Automatic extraction of all page links

### DataProcessor Class
- **Multi-format Export**: Save data as JSON or CSV
- **Timestamping**: Automatic timestamp tracking for all data entries
- **Statistics**: Built-in analytics for collected data
- **Data Validation**: Ensures data integrity throughout processing

## 📋 Requirements

```python
requests>=2.28.0
beautifulsoup4>=4.11.0
pandas>=1.5.0
lxml>=4.9.0  # Optional but recommended for faster parsing
```

## 🔧 Installation

```bash
pip install requests beautifulsoup4 pandas lxml
```

## 💻 Usage Examples

### Basic Web Scraping

```python
from script_b import WebScraper, DataProcessor

# Initialize scraper
scraper = WebScraper("https://example.com")

# Fetch a page
response = scraper.fetch_page("/about")
if response:
    links = scraper.extract_links(response.text)
    content = scraper.extract_text_content(response.text)
```

### Complete Website Analysis

```python
# Analyze up to 10 pages from a website
results = analyze_website("https://example.com", max_pages=10)

# Results are automatically saved as:
# - scrape_results_YYYYMMDD_HHMMSS.json
# - scrape_results_YYYYMMDD_HHMMSS.csv
```

### Custom Data Processing

```python
processor = DataProcessor()

# Add custom data
processor.add_data({
    'page_url': 'https://example.com',
    'title': 'Homepage',
    'word_count': 1500,
    'category': 'main'
})

# Export data
processor.save_to_json('my_analysis.json')
processor.save_to_csv('my_analysis.csv')

# Get statistics
stats = processor.get_statistics()
print(f"Collected {stats['total_entries']} pages")
```

## 📊 Output Format

The script generates structured data with the following fields:

- **page_url**: Full URL of the analyzed page
- **title**: Page title or link text
- **word_count**: Number of words in the page content
- **link_count**: Number of links found on the page
- **status_code**: HTTP response status code
- **timestamp**: ISO format timestamp of when data was collected

## ⚠️ Important Considerations

### Ethical Usage
- **Respect robots.txt**: Always check and follow website robots.txt files
- **Rate Limiting**: Built-in delays prevent server overload
- **Terms of Service**: Ensure compliance with website terms of service
- **Copyright**: Respect intellectual property rights

### Technical Limitations
- **JavaScript Content**: This scraper only processes static HTML content
- **Authentication**: No built-in support for login-required pages
- **Dynamic Content**: AJAX-loaded content won't be captured
- **Large Sites**: Memory usage increases with data volume

## 🔧 Configuration Options

### Custom Headers
```python
scraper = WebScraper("https://example.com")
scraper.session.headers.update({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml'
})
```

### Timeout Settings
```python
# Modify timeout in fetch_page method
response = self.session.get(url, timeout=30)  # 30 second timeout
```

## 🐛 Troubleshooting

### Common Issues

**Connection Errors**
- Check internet connectivity
- Verify target website is accessible
- Consider proxy settings if behind corporate firewall

**Parsing Errors**
- Website might be using non-standard HTML
- Try different BeautifulSoup parsers: 'html.parser', 'lxml', 'html5lib'

**Memory Issues**
- Reduce max_pages parameter
- Process data in smaller batches
- Clear data from processor periodically

## 📈 Performance Tips

1. **Use Session Objects**: Reuse connections for better performance
2. **Implement Caching**: Store responses to avoid repeated requests
3. **Parallel Processing**: Use asyncio for concurrent requests (advanced)
4. **Database Storage**: For large datasets, consider SQLite or other databases

## 🔮 Future Enhancements

- [ ] Async/await support for concurrent scraping
- [ ] Database integration (SQLite, PostgreSQL)
- [ ] JavaScript rendering support (Selenium integration)
- [ ] Built-in data visualization
- [ ] API endpoint support
- [ ] Advanced text analytics (sentiment, keywords)

## 📄 License

This script is provided as-is for educational and research purposes. Please ensure ethical and legal use when scraping websites.

---

*Last updated: 2025-01-24*