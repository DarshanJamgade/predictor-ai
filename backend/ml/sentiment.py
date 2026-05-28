import yfinance as yf
from transformers import pipeline
import torch

# Initialize the sentiment pipeline with FinBERT
try:
    sentiment_pipeline = pipeline(
        "sentiment-analysis", 
        model="ProsusAI/finbert",
        device=0 if torch.cuda.is_available() else -1
    )
except Exception as e:
    print(f"Warning: Could not load FinBERT model: {e}")
    sentiment_pipeline = None

def get_sentiment(ticker):
    """Fetch news and analyze sentiment using FinBERT with robust key checking."""
    if sentiment_pipeline is None:
        return {"score": 0, "label": "Neutral", "headlines": []}

    try:
        stock = yf.Ticker(ticker)
        news = stock.news[:5] # Get latest 5 news items
        
        if not news:
            return {"score": 0, "label": "Neutral", "headlines": []}
            
        # Robustly extract titles, handling different possible yfinance news structures
        headlines = []
        for item in news:
            title = item.get('title') or item.get('text') or ""
            if title:
                headlines.append(title)
        
        if not headlines:
            return {"score": 0, "label": "Neutral", "headlines": []}
        
        # Analyze sentiment for each headline
        results = sentiment_pipeline(headlines)
        
        # Calculate aggregate score
        pos_count = 0
        neg_count = 0
        
        for res in results:
            if res['label'] == 'positive':
                pos_count += 1
            elif res['label'] == 'negative':
                neg_count += 1
                
        total = len(results)
        score = (pos_count - neg_count) / total if total > 0 else 0
        
        label = "Neutral"
        if score > 0.2:
            label = "Positive"
        elif score < -0.2:
            label = "Negative"
            
        return {
            "score": round(score, 2),
            "label": label,
            "headlines": headlines
        }
    except Exception as e:
        print(f"Error in sentiment analysis for {ticker}: {e}")
        return {"score": 0, "label": "Neutral", "headlines": []}
