#!/usr/bin/env python3
"""Simple news fetcher using urllib"""
import json
import urllib.request
import urllib.parse
import re
from datetime import datetime

def fetch_google_news(query, count=10):
    """Fetch news from Google News RSS via RSS feed"""
    try:
        url = f"https://news.google.com/rss/search?q={urllib.parse.quote(query)}"
        
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            xml = response.read().decode('utf-8', errors='ignore')
        
        import xml.etree.ElementTree as ET
        root = ET.fromstring(xml)
        
        items = root.findall('.//item')
        results = []
        
        for item in items[:count]:
            title = item.findtext('title', '')
            link = item.findtext('link', '')
            source = item.findtext('source', '')
            
            if title and link:
                results.append({
                    'title': title,
                    'url': link,
                    'source': source if source else urllib.parse.urlparse(link).netloc.replace('news.google.com', 'Google News')
                })
        
        return results
    except Exception as e:
        print(f"Error fetching Google: {e}")
        return []

def main():
    date = datetime.now().strftime('%Y-%m-%d')
    print(f"AI Daily Digest - News Collection")
    print(f"===================================")
    print(f"Date: {date}")
    
    # Search queries
    queries = {
        'aiTech': ['AI 科技 新闻', '人工智能 最新 2026', 'ChatGPT GPT-5 新闻'],
        'cryptoWeb3': ['加密货币 新闻', '比特币 以太坊 2026', '区块链 Web3 新闻'],
        'businessStartup': ['创业 投资 新闻', '商业 科技 公司 2026', '科技行业 新闻']
    }
    
    all_news = {
        'date': date,
        'generatedAt': datetime.now().strftime('%Y-%m-%d %H:%M:%S CST'),
        'categories': {},
        'summary': {}
    }
    
    total = 0
    top_stories = []
    
    for category, q_list in queries.items():
        print(f"Searching {category}...")
        news_items = []
        
        for query in q_list:
            results = fetch_google_news(query, 5)
            for r in results:
                if not any(n['url'] == r['url'] for n in news_items):
                    news_items.append({
                        'title': r['title'],
                        'url': r['url'],
                        'snippet': r['title'],
                        'date': date,
                        'source': r['source'],
                        'category': category
                    })
        
        seen_urls = set()
        unique_items = []
        for item in news_items:
            if item['url'] not in seen_urls:
                seen_urls.add(item['url'])
                unique_items.append(item)
        
        all_news['categories'][category] = unique_items[:10]
        total += len(unique_items)
        if unique_items:
            top_stories.append(unique_items[0]['title'])
        
        print(f"   Found {len(unique_items)} articles")
    
    all_news['summary'] = {
        'totalArticles': total,
        'topStories': top_stories[:3]
    }
    
    # Save to file
    data_dir = '/Users/seanliang/.openclaw/workspace/ai-daily-digest/data/news'
    
    import os
    os.makedirs(data_dir, exist_ok=True)
    
    data_path = f"{data_dir}/{date}.json"
    with open(data_path, 'w', encoding='utf-8') as f:
        json.dump(all_news, f, ensure_ascii=False, indent=2)
    
    print(f"Data saved: {data_path}")
    print(f"Total articles: {total}")
    
    return all_news

if __name__ == '__main__':
    main()