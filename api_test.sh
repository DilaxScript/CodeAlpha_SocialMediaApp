#!/bin/bash
echo "🧪 Testing API Endpoints..."

echo "1. Testing health endpoint:"
curl -s http://127.0.0.1:8000/api/health/ | python3 -m json.tool

echo ""
echo "2. Testing token endpoint (will fail without user):"
curl -s -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass123"}'

echo ""
echo "✅ Server is running! Create a user with: python manage.py createsuperuser"
