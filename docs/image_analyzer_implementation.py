"""
Image Analysis Algorithms for Flowchart Comparison
Implementation example for the 4-algorithm scoring system
"""

import cv2
import numpy as np
from scipy.spatial.distance import directed_hausdorff
from scipy.optimize import linear_sum_assignment
from sklearn.cluster import KMeans
import colorsys


class FlowchartImageAnalyzer:
    """
    Implements the 4-algorithm approach for flowchart image comparison:
    Final Score = (Structure × 30%) + (Color Histogram × 25%) + (Edges × 25%) + (Dominant Colors × 20%)
    """
    
    def __init__(self):
        self.weights = {
            'structure': 0.30,
            'histogram': 0.25,
            'edges': 0.25,
            'dominant_colors': 0.20
        }
    
    def preprocess_image(self, image):
        """Standardize image preprocessing"""
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
    
    def calculate_similarity(self, image1, image2):
        """
        Calculate overall similarity score using all 4 algorithms
        Returns: float between 0.0 and 1.0
        """
        # Preprocess images
        img1 = self.preprocess_image(image1)
        img2 = self.preprocess_image(image2)
        
        # Calculate individual algorithm scores
        scores = {}
        scores['structure'] = self._analyze_structure(img1, img2)
        scores['histogram'] = self._analyze_color_histogram(img1, img2)
        scores['edges'] = self._analyze_edges(img1, img2)
        scores['dominant_colors'] = self._analyze_dominant_colors(img1, img2)
        
        # Calculate weighted final score
        final_score = sum(scores[key] * self.weights[key] for key in scores)
        
        return {
            'final_score': final_score,
            'individual_scores': scores,
            'interpretation': self._interpret_score(final_score)
        }
    
    def _analyze_structure(self, image1, image2):
        """Algorithm 1: Structure Analysis (30% weight)"""
        try:
            # Convert to grayscale
            gray1 = cv2.cvtColor(image1, cv2.COLOR_BGR2GRAY)
            gray2 = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)
            
            # Find contours
            contours1, _ = cv2.findContours(gray1, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            contours2, _ = cv2.findContours(gray2, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Extract features
            features1 = self._extract_structural_features(contours1, gray1.shape)
            features2 = self._extract_structural_features(contours2, gray2.shape)
            
            # Calculate similarity
            return self._calculate_structural_similarity(features1, features2)
        except Exception:
            return 0.0
    
    def _extract_structural_features(self, contours, image_shape):
        """Extract structural features from contours"""
        features = []
        h, w = image_shape
        
        for contour in contours:
            if cv2.contourArea(contour) < 100:  # Filter small noise
                continue
                
            x, y, width, height = cv2.boundingRect(contour)
            area = cv2.contourArea(contour)
            
            features.append({
                'normalized_position': (x/w, y/h),
                'normalized_size': (width/w, height/h),
                'area_ratio': area / (w * h),
                'aspect_ratio': width / height if height > 0 else 0,
            })
        
        return features
    
    def _calculate_structural_similarity(self, features1, features2):
        """Calculate similarity between structural features"""
        if not features1 or not features2:
            return 0.0
        
        # Simple approach: compare number of similar-sized objects
        len_diff = abs(len(features1) - len(features2))
        max_len = max(len(features1), len(features2))
        
        if max_len == 0:
            return 1.0
        
        # Penalize for different number of objects
        count_similarity = 1.0 - (len_diff / max_len)
        
        # TODO: Implement more sophisticated matching algorithm
        # This is a simplified version for demonstration
        return max(0.0, count_similarity)
    
    def _analyze_color_histogram(self, image1, image2):
        """Algorithm 2: Color Histogram Analysis (25% weight)"""
        try:
            # Convert to HSV
            hsv1 = cv2.cvtColor(image1, cv2.COLOR_BGR2HSV)
            hsv2 = cv2.cvtColor(image2, cv2.COLOR_BGR2HSV)
            
            # Calculate histograms
            hist1_h = cv2.calcHist([hsv1], [0], None, [50], [0, 180])
            hist1_s = cv2.calcHist([hsv1], [1], None, [32], [0, 256])
            hist1_v = cv2.calcHist([hsv1], [2], None, [32], [0, 256])
            
            hist2_h = cv2.calcHist([hsv2], [0], None, [50], [0, 180])
            hist2_s = cv2.calcHist([hsv2], [1], None, [32], [0, 256])
            hist2_v = cv2.calcHist([hsv2], [2], None, [32], [0, 256])
            
            # Normalize
            cv2.normalize(hist1_h, hist1_h, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
            cv2.normalize(hist2_h, hist2_h, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
            cv2.normalize(hist1_s, hist1_s, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
            cv2.normalize(hist2_s, hist2_s, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
            cv2.normalize(hist1_v, hist1_v, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
            cv2.normalize(hist2_v, hist2_v, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
            
            # Calculate correlations
            corr_h = cv2.compareHist(hist1_h, hist2_h, cv2.HISTCMP_CORREL)
            corr_s = cv2.compareHist(hist1_s, hist2_s, cv2.HISTCMP_CORREL)
            corr_v = cv2.compareHist(hist1_v, hist2_v, cv2.HISTCMP_CORREL)
            
            # Weighted combination
            similarity = (corr_h * 0.5 + corr_s * 0.3 + corr_v * 0.2)
            return max(0.0, similarity)
        except Exception:
            return 0.0
    
    def _analyze_edges(self, image1, image2):
        """Algorithm 3: Edge Detection Analysis (25% weight)"""
        try:
            # Convert to grayscale
            gray1 = cv2.cvtColor(image1, cv2.COLOR_BGR2GRAY)
            gray2 = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)
            
            # Apply Gaussian blur
            blur1 = cv2.GaussianBlur(gray1, (5, 5), 0)
            blur2 = cv2.GaussianBlur(gray2, (5, 5), 0)
            
            # Edge detection with multiple thresholds
            similarities = []
            thresholds = [(50, 150), (100, 200), (150, 250)]
            
            for low, high in thresholds:
                edge1 = cv2.Canny(blur1, low, high)
                edge2 = cv2.Canny(blur2, low, high)
                
                # Calculate edge similarity
                similarity = self._calculate_edge_similarity(edge1, edge2)
                similarities.append(similarity)
            
            # Weighted average
            return np.average(similarities, weights=[0.5, 0.3, 0.2])
        except Exception:
            return 0.0
    
    def _calculate_edge_similarity(self, edge1, edge2):
        """Calculate similarity between edge images"""
        # Simple approach: compare edge density
        edge_count1 = np.sum(edge1 > 0)
        edge_count2 = np.sum(edge2 > 0)
        
        if edge_count1 == 0 and edge_count2 == 0:
            return 1.0
        if edge_count1 == 0 or edge_count2 == 0:
            return 0.0
        
        # Compare edge density
        total_pixels = edge1.shape[0] * edge1.shape[1]
        density1 = edge_count1 / total_pixels
        density2 = edge_count2 / total_pixels
        
        density_similarity = 1.0 - abs(density1 - density2)
        
        # XOR comparison for edge overlap
        xor_result = cv2.bitwise_xor(edge1, edge2)
        overlap_similarity = 1.0 - (np.sum(xor_result > 0) / total_pixels)
        
        return (density_similarity * 0.4 + overlap_similarity * 0.6)
    
    def _analyze_dominant_colors(self, image1, image2, k=5):
        """Algorithm 4: Dominant Colors Analysis (20% weight)"""
        try:
            colors1 = self._extract_dominant_colors(image1, k)
            colors2 = self._extract_dominant_colors(image2, k)
            
            return self._calculate_color_palette_similarity(colors1, colors2)
        except Exception:
            return 0.0
    
    def _extract_dominant_colors(self, image, k):
        """Extract dominant colors using K-means clustering"""
        # Reshape image to be a list of pixels
        data = image.reshape((-1, 3))
        data = np.float32(data)
        
        # Apply K-means
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
        _, labels, centers = cv2.kmeans(data, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
        
        # Calculate percentages
        unique, counts = np.unique(labels, return_counts=True)
        percentages = counts / len(labels)
        
        # Sort by percentage
        sorted_indices = np.argsort(percentages)[::-1]
        dominant_colors = []
        
        for i in sorted_indices:
            color = centers[i].astype(int)
            percentage = percentages[i]
            dominant_colors.append({
                'color': color,
                'percentage': percentage
            })
        
        return dominant_colors
    
    def _calculate_color_palette_similarity(self, colors1, colors2):
        """Calculate similarity between color palettes"""
        if not colors1 or not colors2:
            return 0.0
        
        # Simple approach: compare most dominant colors
        similarities = []
        
        for i in range(min(len(colors1), len(colors2))):
            color1 = colors1[i]['color']
            color2 = colors2[i]['color']
            
            # Calculate Euclidean distance in RGB space
            distance = np.sqrt(np.sum((color1 - color2) ** 2))
            # Normalize to 0-1 scale (max distance is sqrt(3*255^2))
            normalized_distance = distance / (255 * np.sqrt(3))
            similarity = 1.0 - normalized_distance
            
            # Weight by color percentage
            weight = (colors1[i]['percentage'] + colors2[i]['percentage']) / 2
            similarities.append(similarity * weight)
        
        return sum(similarities) if similarities else 0.0
    
    def _interpret_score(self, score):
        """Interpret the similarity score"""
        if score >= 0.9:
            return "Extremely similar"
        elif score >= 0.7:
            return "High similarity"
        elif score >= 0.5:
            return "Moderate similarity"
        elif score >= 0.3:
            return "Low similarity"
        else:
            return "Very different"


# Example usage
def compare_flowcharts(image_path1, image_path2):
    """
    Example function to compare two flowchart images
    """
    # Load images
    image1 = cv2.imread(image_path1)
    image2 = cv2.imread(image_path2)
    
    if image1 is None or image2 is None:
        raise ValueError("Could not load one or both images")
    
    # Initialize analyzer
    analyzer = FlowchartImageAnalyzer()
    
    # Calculate similarity
    result = analyzer.calculate_similarity(image1, image2)
    
    print(f"Final Similarity Score: {result['final_score']:.3f}")
    print(f"Interpretation: {result['interpretation']}")
    print("\nIndividual Algorithm Scores:")
    for algorithm, score in result['individual_scores'].items():
        weight = analyzer.weights[algorithm]
        print(f"  {algorithm.replace('_', ' ').title()}: {score:.3f} (weight: {weight*100}%)")
    
    return result


if __name__ == "__main__":
    # Example usage
    # result = compare_flowcharts("flowchart1.jpg", "flowchart2.jpg")
    print("FlowchartImageAnalyzer is ready for use!")
    print("Use compare_flowcharts(image_path1, image_path2) to compare two flowchart images.")