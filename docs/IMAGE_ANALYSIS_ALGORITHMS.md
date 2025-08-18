# Image Analysis Algorithms for Flowchart Comparison

## Overview

This document details the 4 algorithms used in our image similarity scoring system for flowchart comparison. The final score is calculated using a weighted formula:

**Final Score = (Structure × 30%) + (Color Histogram × 25%) + (Edges × 25%) + (Dominant Colors × 20%)**

Each algorithm contributes to understanding different aspects of image similarity, creating a comprehensive comparison system.

---

## 1. Structure Analysis Algorithm (30% Weight)

### Purpose
The Structure Analysis Algorithm examines the spatial arrangement and geometric relationships between elements in flowchart images. It has the highest weight (30%) because structural similarity is the most important factor in flowchart comparison.

### Algorithm Details

#### Method: Template Matching + Contour Analysis
```python
def analyze_structure(image1, image2):
    # Convert to grayscale
    gray1 = cv2.cvtColor(image1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)
    
    # Find contours (shapes/blocks)
    contours1, _ = cv2.findContours(gray1, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours2, _ = cv2.findContours(gray2, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Extract structural features
    features1 = extract_structural_features(contours1)
    features2 = extract_structural_features(contours2)
    
    # Calculate similarity score
    return calculate_structural_similarity(features1, features2)

def extract_structural_features(contours):
    features = []
    for contour in contours:
        # Bounding box properties
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        
        features.append({
            'position': (x, y),
            'size': (w, h),
            'area': area,
            'aspect_ratio': w/h,
            'relative_position': calculate_relative_position(x, y)
        })
    return features
```

#### Key Features Analyzed:
1. **Block Positions**: Spatial coordinates of flowchart elements
2. **Size Relationships**: Relative sizes of different components
3. **Connectivity Patterns**: How elements are connected
4. **Layout Structure**: Overall arrangement (top-down, left-right flow)
5. **Geometric Properties**: Shapes, angles, and proportions

#### Why 30% Weight?
- Structure is the fundamental aspect of flowchart comparison
- Determines logical flow and process organization
- Most critical for educational assessment
- Represents the core algorithmic thinking

---

## 2. Color Histogram Algorithm (25% Weight)

### Purpose
Analyzes the distribution of colors throughout the image to identify similarity in color usage patterns, which can indicate similar tools, themes, or drawing styles.

### Algorithm Details

#### Method: HSV Color Space Histogram Comparison
```python
def analyze_color_histogram(image1, image2):
    # Convert to HSV color space for better color analysis
    hsv1 = cv2.cvtColor(image1, cv2.COLOR_BGR2HSV)
    hsv2 = cv2.cvtColor(image2, cv2.COLOR_BGR2HSV)
    
    # Calculate histograms for each channel
    hist1_h = cv2.calcHist([hsv1], [0], None, [50], [0, 180])
    hist1_s = cv2.calcHist([hsv1], [1], None, [32], [0, 256])
    hist1_v = cv2.calcHist([hsv1], [2], None, [32], [0, 256])
    
    hist2_h = cv2.calcHist([hsv2], [0], None, [50], [0, 180])
    hist2_s = cv2.calcHist([hsv2], [1], None, [32], [0, 256])
    hist2_v = cv2.calcHist([hsv2], [2], None, [32], [0, 256])
    
    # Normalize histograms
    cv2.normalize(hist1_h, hist1_h, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
    cv2.normalize(hist2_h, hist2_h, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
    
    # Calculate correlation coefficients
    corr_h = cv2.compareHist(hist1_h, hist2_h, cv2.HISTCMP_CORREL)
    corr_s = cv2.compareHist(hist1_s, hist2_s, cv2.HISTCMP_CORREL)
    corr_v = cv2.compareHist(hist1_v, hist2_v, cv2.HISTCMP_CORREL)
    
    # Weighted combination
    return (corr_h * 0.5 + corr_s * 0.3 + corr_v * 0.2)
```

#### Key Features Analyzed:
1. **Hue Distribution**: Primary colors used in the flowchart
2. **Saturation Patterns**: Color intensity and vibrancy
3. **Value Distribution**: Brightness levels across the image
4. **Color Frequency**: How often specific colors appear
5. **Color Relationships**: Complementary and analogous color usage

#### Why 25% Weight?
- Color consistency indicates similar drawing tools/software
- Reflects user preferences and style
- Important for visual similarity assessment
- Helps identify template-based vs. hand-drawn flowcharts

---

## 3. Edge Detection Algorithm (25% Weight)

### Purpose
Identifies and compares the edges and boundaries in flowchart images to analyze structural similarity at a more granular level than overall structure analysis.

### Algorithm Details

#### Method: Multi-Scale Canny Edge Detection + Hausdorff Distance
```python
def analyze_edges(image1, image2):
    # Convert to grayscale
    gray1 = cv2.cvtColor(image1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur to reduce noise
    blur1 = cv2.GaussianBlur(gray1, (5, 5), 0)
    blur2 = cv2.GaussianBlur(gray2, (5, 5), 0)
    
    # Multi-scale edge detection
    edges1 = []
    edges2 = []
    
    thresholds = [(50, 150), (100, 200), (150, 250)]
    for low, high in thresholds:
        edge1 = cv2.Canny(blur1, low, high)
        edge2 = cv2.Canny(blur2, low, high)
        edges1.append(edge1)
        edges2.append(edge2)
    
    # Calculate edge similarity for each scale
    similarities = []
    for e1, e2 in zip(edges1, edges2):
        similarity = calculate_edge_similarity(e1, e2)
        similarities.append(similarity)
    
    # Return weighted average
    return np.average(similarities, weights=[0.5, 0.3, 0.2])

def calculate_edge_similarity(edge1, edge2):
    # Find edge coordinates
    coords1 = np.column_stack(np.where(edge1 > 0))
    coords2 = np.column_stack(np.where(edge2 > 0))
    
    # Calculate Hausdorff distance
    if len(coords1) == 0 or len(coords2) == 0:
        return 0.0
    
    # Bidirectional Hausdorff distance
    dist1 = directed_hausdorff(coords1, coords2)[0]
    dist2 = directed_hausdorff(coords2, coords1)[0]
    hausdorff_dist = max(dist1, dist2)
    
    # Convert to similarity score (0-1)
    max_distance = np.sqrt(edge1.shape[0]**2 + edge1.shape[1]**2)
    similarity = 1 - (hausdorff_dist / max_distance)
    
    return max(0, similarity)
```

#### Key Features Analyzed:
1. **Edge Density**: Amount of edge information in different regions
2. **Edge Orientation**: Direction and angle of edges
3. **Edge Continuity**: How well edges connect and flow
4. **Corner Detection**: Sharp turns and decision points
5. **Line Thickness**: Consistency in drawing style

#### Why 25% Weight?
- Edges represent the actual drawing strokes and boundaries
- Critical for shape recognition and comparison
- Captures fine-grained structural details
- Essential for distinguishing between similar but different flowcharts

---

## 4. Dominant Colors Algorithm (20% Weight)

### Purpose
Identifies and compares the most prominent colors in flowchart images to understand color palette similarity and visual consistency.

### Algorithm Details

#### Method: K-Means Clustering + Color Distance Calculation
```python
def analyze_dominant_colors(image1, image2, k=5):
    # Extract dominant colors using K-means clustering
    colors1 = extract_dominant_colors(image1, k)
    colors2 = extract_dominant_colors(image2, k)
    
    # Calculate color similarity
    return calculate_color_palette_similarity(colors1, colors2)

def extract_dominant_colors(image, k):
    # Reshape image to be a list of pixels
    data = image.reshape((-1, 3))
    data = np.float32(data)
    
    # Apply K-means clustering
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(data, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
    
    # Calculate color percentages
    unique, counts = np.unique(labels, return_counts=True)
    percentages = counts / len(labels)
    
    # Sort by percentage (most dominant first)
    sorted_indices = np.argsort(percentages)[::-1]
    dominant_colors = []
    
    for i in sorted_indices:
        color = centers[i].astype(int)
        percentage = percentages[i]
        dominant_colors.append({
            'color': color,
            'percentage': percentage,
            'lab_color': rgb_to_lab(color)  # For better color distance calculation
        })
    
    return dominant_colors

def calculate_color_palette_similarity(colors1, colors2):
    # Use Hungarian algorithm for optimal color matching
    distance_matrix = np.zeros((len(colors1), len(colors2)))
    
    for i, c1 in enumerate(colors1):
        for j, c2 in enumerate(colors2):
            # Calculate Delta E color distance in LAB color space
            delta_e = calculate_delta_e(c1['lab_color'], c2['lab_color'])
            distance_matrix[i][j] = delta_e
    
    # Find optimal matching
    row_indices, col_indices = linear_sum_assignment(distance_matrix)
    
    # Calculate weighted similarity
    total_similarity = 0
    total_weight = 0
    
    for i, j in zip(row_indices, col_indices):
        color_distance = distance_matrix[i][j]
        # Convert distance to similarity (Delta E of 0 = perfect match)
        similarity = max(0, 1 - (color_distance / 100))  # 100 is max perceptible difference
        
        # Weight by the percentage of the color in the image
        weight = (colors1[i]['percentage'] + colors2[j]['percentage']) / 2
        total_similarity += similarity * weight
        total_weight += weight
    
    return total_similarity / total_weight if total_weight > 0 else 0

def calculate_delta_e(lab1, lab2):
    # CIE76 Delta E formula for perceptual color difference
    delta_l = lab1[0] - lab2[0]
    delta_a = lab1[1] - lab2[1]
    delta_b = lab1[2] - lab2[2]
    
    return np.sqrt(delta_l**2 + delta_a**2 + delta_b**2)
```

#### Key Features Analyzed:
1. **Primary Colors**: Most prominent colors in the image
2. **Color Proportions**: How much of each color is present
3. **Color Harmony**: Relationships between dominant colors
4. **Background vs. Foreground**: Separation of content colors
5. **Color Consistency**: Uniformity in color usage

#### Why 20% Weight?
- Dominant colors reflect overall visual theme and style
- Indicates consistency in drawing tools and preferences
- Helps distinguish between different flowchart types
- Provides additional validation for similarity assessment

---

## Algorithm Integration and Final Scoring

### Weighted Combination Formula
```python
def calculate_final_score(structure_score, histogram_score, edges_score, dominant_colors_score):
    final_score = (
        structure_score * 0.30 +
        histogram_score * 0.25 +
        edges_score * 0.25 +
        dominant_colors_score * 0.20
    )
    return final_score
```

### Score Interpretation
- **0.9 - 1.0**: Extremely similar (likely same or very similar flowcharts)
- **0.7 - 0.9**: High similarity (similar structure with minor differences)
- **0.5 - 0.7**: Moderate similarity (similar concept, different execution)
- **0.3 - 0.5**: Low similarity (some common elements)
- **0.0 - 0.3**: Very different (different flowcharts entirely)

### Performance Considerations
1. **Preprocessing**: Image normalization and noise reduction
2. **Scaling**: Resize images to standard dimensions for fair comparison
3. **Optimization**: Use image pyramids for multi-scale analysis
4. **Caching**: Store calculated features for repeated comparisons

---

## Implementation Best Practices

### 1. Image Preprocessing
```python
def preprocess_image(image):
    # Resize to standard dimensions
    image = cv2.resize(image, (800, 600))
    
    # Normalize brightness and contrast
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8)).apply(l)
    image = cv2.merge([l, a, b])
    image = cv2.cvtColor(image, cv2.COLOR_LAB2BGR)
    
    # Remove noise
    image = cv2.bilateralFilter(image, 9, 75, 75)
    
    return image
```

### 2. Error Handling
```python
def safe_algorithm_execution(algorithm_func, *args, **kwargs):
    try:
        return algorithm_func(*args, **kwargs)
    except Exception as e:
        print(f"Error in {algorithm_func.__name__}: {e}")
        return 0.0  # Return neutral score on error
```

### 3. Validation and Testing
- Use ground truth datasets with known similarity scores
- Cross-validate against human expert assessments
- Test with various flowchart types and drawing styles
- Monitor performance across different image qualities

---

## Conclusion

This 4-algorithm approach provides a comprehensive and robust method for comparing flowchart images. Each algorithm contributes unique insights:

- **Structure Analysis** captures the logical flow and organization
- **Color Histogram** identifies visual consistency and style
- **Edge Detection** provides detailed boundary and shape comparison
- **Dominant Colors** analyzes color palette similarity

The weighted combination ensures that the most important aspects (structure) have the highest influence while still considering visual and stylistic factors for a complete similarity assessment.