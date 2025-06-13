# Flowchart AI Backend

This directory contains the Python FastAPI backend for the Flowchart Programming Academy.

## Setup and Running

1.  **Navigate to Backend Directory**:
    Open your terminal and change directory to `backend`:
    ```bash
    cd backend
    ```

2.  **Create a Python Virtual Environment**:
    It's highly recommended to use a virtual environment to manage dependencies.
    ```bash
    python -m venv venv
    ```
    (If you're using a specific Python version, like `python3`, use that command instead of `python`)

3.  **Activate the Virtual Environment**:
    *   On Windows:
        ```bash
        .\venv\Scripts\activate
        ```
    *   On macOS/Linux:
        ```bash
        source venv/bin/activate
        ```

4.  **Install Dependencies**:
    Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```

5.  **Run the FastAPI Server**:
    Start the development server using Uvicorn:
    ```bash
    uvicorn main:app --reload --port 8000
    ```
    *   `main:app` tells Uvicorn to look for an object named `app` in a file named `main.py`.
    *   `--reload` enables auto-reloading when code changes (useful for development).
    *   `--port 8000` specifies the port the server will listen on. The application will be available at `http://localhost:8000`.
