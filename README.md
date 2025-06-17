# Flowchart-to-Code-learning

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/surajsahani/Flowchart-to-Code-learning)

## Features

### Backend

#### Item Pagination Endpoint

*   **Endpoint:** `GET /items`
*   **Description:** Provides a paginated list of generic items. This is useful for fetching large datasets in chunks for display in admin panels or other interfaces.
*   **Query Parameters:**
    *   `page` (integer, optional, default: 1): The page number to retrieve.
    *   `size` (integer, optional, default: 10): The number of items to retrieve per page (max: 100).
*   **Response:**
    ```json
    {
        "items": [
            {
                "id": 1,
                "name": "Item 1",
                "description": "Description for item 1"
            }
            // ... more items
        ],
        "total_items": 100,
        "page": 1,
        "size": 10,
        "total_pages": 10
    }
    ```
*   **Working:** The endpoint slices a predefined list of mock items based on the `page` and `size` parameters. It returns the requested items along with metadata about the pagination state (total items, current page, page size, and total pages). In a real application, this would typically fetch data from a database.