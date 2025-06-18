import requests
from bs4 import BeautifulSoup
import json

def analyze_kenal_production():
    print("Analyzing KENAL Admin Production Site...")
    
    # Try to get the main page
    try:
        response = requests.get('https://kenal-admin.netlify.app/')
        print(f"1. Status Code: {response.status_code}")
        
        # Check if we're redirected
        if response.history:
            print(f"2. Redirected from: {response.history[0].url}")
            print(f"   Redirected to: {response.url}")
        
        # Parse the HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for Next.js data
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string and 'static/chunks' in script.string:
                print("3. Found Next.js chunks - this is a client-side rendered app")
                
        # Try to fetch the login page directly
        login_response = requests.get('https://kenal-admin.netlify.app/login')
        print(f"\n4. Login page status: {login_response.status_code}")
        
        # Check for any API endpoints in the JavaScript
        js_files = []
        for link in soup.find_all('link', {'rel': 'preload'}):
            if link.get('href', '').endswith('.js'):
                js_files.append(link['href'])
        
        print(f"\n5. Found {len(js_files)} JavaScript files")
        
        # Try to get the manifest files
        manifest_urls = [
            '/_next/static/chunks/webpack.js',
            '/_next/static/chunks/main.js',
            '/_next/static/chunks/pages/_app.js',
            '/manifest.json',
            '/build-manifest.json'
        ]
        
        print("\n6. Checking for manifest files...")
        for url in manifest_urls:
            try:
                manifest_response = requests.get(f'https://kenal-admin.netlify.app{url}')
                if manifest_response.status_code == 200:
                    print(f"   - Found: {url}")
            except:
                pass
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_kenal_production()
