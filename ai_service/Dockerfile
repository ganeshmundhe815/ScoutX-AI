# 1. Base Python image
FROM python:3.11-slim

# 2. Install Linux system dependencies for OpenCV and MediaPipe
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# 3. Set working directory
WORKDIR /app

# 4. Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt flask flask-cors gunicorn

# 5. Copy source code
COPY . .

# 6. Expose port (Google Cloud Run uses port 8000/8080)
ENV PORT=8000
EXPOSE 8000

# 7. Start production Gunicorn server
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120", "app:app"]
