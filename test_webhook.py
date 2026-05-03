import requests
import uuid

# يولد payment_id جديد كل مرة
payment_id = str(uuid.uuid4())

# أضف أوردر جديد أول
requests.post("http://localhost:5000/api/test-order", json={
    "payment_id": payment_id,
    "product_id": 3,  # غير هذا لـ id المنتج اللي تبينه
})

# بعدين أرسل webhook
response = requests.post("http://localhost:5000/webhook/fib", json={
    "id":     payment_id,
    "status": "PAID"
})

print("Status code:", response.status_code)
print("Response:   ", response.text)