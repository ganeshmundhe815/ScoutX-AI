# 1. Base Python image
FROM python:3.10-slim

# 2. Install Linux system dependencies for OpenCV, MediaPipe, and PyTorch
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libgles2 \
    ffmpeg \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 3. Set working directory
WORKDIR /app

# 4. Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy source code
COPY . .

# 6. Ensure uploads folder exists
RUN mkdir -p uploads

# 7. Expose port
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# 8. Start AI microservice with production-grade WSGI server (1 worker, 4 threads to fit within memory budgets)
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 1 --threads 4 --timeout 180 app:app"]
