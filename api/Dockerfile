# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app/

# Install system dependencies for Python packages and other utilities
RUN apt-get update && apt-get install -y \
    libjpeg-dev \
    libpng-dev \
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies from requirements.txt
RUN pip install -r requirements.txt

# Expose the port the app runs on
EXPOSE 7135

# Set the entrypoint to run the FastAPI app using Uvicorn
CMD ["uvicorn", "fast:application", "--host", "0.0.0.0", "--port", "7135"]