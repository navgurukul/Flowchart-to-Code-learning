"""
Analyzes flowchart images to extract structured data.
Uses Google Cloud Vision API for object detection, OCR, and line detection.
"""
from google.cloud import vision
from google.auth import exceptions as auth_exceptions # For credential errors
import traceback # For logging full tracebacks
from typing import List, Dict, Any

def analyze_image_content(image_content: bytes) -> Dict[str, Any]:
    """
    Analyzes the given image content using Google Cloud Vision API.
    Args:
        image_content: The byte content of the image.
    Returns:
        A dictionary containing the extracted chart JSON.
    """
    print(f"analyze_image_content: Called with image_content length: {len(image_content)} bytes")

    try:
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=image_content)
    except auth_exceptions.DefaultCredentialsError as e:
        print(f"ERROR: Google Cloud Default Credentials not found. Details: {e}")
        print("Please ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set or you are logged in via gcloud auth application-default login.")
        raise Exception("Vision API Credentials Error: Could not authenticate with Google Cloud. Please check backend server logs.")
    except Exception as e:
        print(f"ERROR: Failed to initialize Vision API client or image object. Details: {e}")
        traceback.print_exc()
        raise Exception(f"Vision API Setup Error: {str(e)}")

    extracted_nodes: List[Dict[str, Any]] = []
    extracted_edges: List[Dict[str, Any]] = []
    image_width, image_height = 0, 0

    try:
        # --- 1. Text Detection (OCR) & Initial Node Creation ---
        print("Performing text detection...")
        doc_text_response = client.document_text_detection(image=image)

        if doc_text_response.error.message:
            print(f"ERROR: Vision API (document_text_detection) returned an error: {doc_text_response.error.message}")
            full_text_annotation = None
        else:
            full_text_annotation = doc_text_response.full_text_annotation

        if doc_text_response.text_annotations:
            first_annotation_poly = doc_text_response.text_annotations[0].bounding_poly
            if first_annotation_poly and first_annotation_poly.vertices and len(first_annotation_poly.vertices) == 4:
                all_x = [v.x for v in first_annotation_poly.vertices]
                all_y = [v.y for v in first_annotation_poly.vertices]
                image_width = max(all_x) if all_x else 0
                image_height = max(all_y) if all_y else 0
                print(f"Inferred image dimensions: {image_width}w x {image_height}h")
            else:
                print("Warning: Could not infer image dimensions from text_annotations[0].")

        node_id_counter = 0
        text_derived_nodes: List[Dict[str, Any]] = []

        if full_text_annotation:
            for page in full_text_annotation.pages:
                if image_width == 0 and page.width > 0: image_width = page.width
                if image_height == 0 and page.height > 0: image_height = page.height

                for block in page.blocks:
                    block_text_list = []
                    for paragraph in block.paragraphs:
                        for word in paragraph.words:
                            word_text = "".join([symbol.text for symbol in word.symbols])
                            block_text_list.append(word_text)
                    full_block_text = " ".join(block_text_list).strip()

                    if full_block_text and block.confidence >= 0.6:
                        node_id_counter += 1
                        node_id = f"text_node_{node_id_counter}"
                        pos_x = block.bounding_poly.vertices[0].x if block.bounding_poly.vertices else 0
                        pos_y = block.bounding_poly.vertices[0].y if block.bounding_poly.vertices else 0
                        node_type = "process"
                        if block.bounding_poly.vertices and len(block.bounding_poly.vertices) == 4:
                            if "?" in full_block_text or full_block_text.lower().startswith("if"):
                                node_type = "decision"
                            elif "start" in full_block_text.lower() or "begin" in full_block_text.lower():
                                node_type = "start"
                            elif "end" in full_block_text.lower() or "stop" in full_block_text.lower():
                                node_type = "end"
                        text_derived_nodes.append({
                            "id": node_id, "type": node_type,
                            "position": {"x": pos_x, "y": pos_y}, # Top-left for now
                            "data": {"label": full_block_text, "value": "", "condition": ""},
                            "bounding_poly": [{"x": v.x, "y": v.y} for v in block.bounding_poly.vertices]
                        })
                        print(f"Detected text: '{full_block_text}' type:{node_type} ({pos_x},{pos_y}) conf:{block.confidence:.2f}")
        else:
            print("Warning: full_text_annotation was None or empty. No text blocks processed.")

        # --- 2. Object Localization & Correlation ---
        localized_object_annotations = []
        if image_width > 0 and image_height > 0:
            print("Performing object localization...")
            objects_response = client.object_localization(image=image)
            if objects_response.error.message:
                 print(f"ERROR: Vision API (object_localization) returned an error: {objects_response.error.message}")
            else:
                localized_object_annotations = objects_response.localized_object_annotations
                print(f"Found {len(localized_object_annotations)} localized objects.")
                for obj_idx, obj in enumerate(localized_object_annotations):
                    print(f"  Obj {obj_idx}: {obj.name} (Conf: {obj.score:.2f})")
        else:
            print("Skipping object localization: image dimensions unknown.")

        def get_bounding_box(vertices_list):
            if not vertices_list: return 0,0,0,0
            xs = [v['x'] for v in vertices_list]; ys = [v['y'] for v in vertices_list]
            return min(xs) if xs else 0, min(ys) if ys else 0, max(xs) if xs else 0, max(ys) if ys else 0


        def calculate_iou(box1, box2):
            x_left,y_top = max(box1[0],box2[0]),max(box1[1],box2[1])
            x_right,y_bottom = min(box1[2],box2[2]),min(box1[3],box2[3])
            if x_right<x_left or y_bottom<y_top: return 0.0
            area = (x_right-x_left)*(y_bottom-y_top)
            b1a=(box1[2]-box1[0])*(box1[3]-box1[1]); b2a=(box2[2]-box2[0])*(box2[3]-box2[1])
            if (b1a+b2a-area) == 0: return 1.0 if area > 0 else 0.0 # Avoid division by zero if areas are zero or perfectly overlap
            return area/float(b1a+b2a-area)

        final_nodes_map: Dict[str, Dict[str, Any]] = {}
        matched_text_ids = set()

        if localized_object_annotations and image_width > 0 and image_height > 0:
            for obj in localized_object_annotations:
                if obj.score < 0.4: continue
                obj_verts_px = [{'x':v.x*image_width,'y':v.y*image_height} for v in obj.bounding_poly.normalized_vertices]
                obj_bbox = get_bounding_box(obj_verts_px)

                best_match, best_iou = None, 0.0
                for txt_node in text_derived_nodes:
                    if txt_node['id'] in matched_text_ids: continue
                    txt_bbox = get_bounding_box(txt_node['bounding_poly'])
                    iou = calculate_iou(obj_bbox, txt_bbox)
                    if iou > 0.1 and iou > best_iou:
                        best_iou = iou
                        best_match = txt_node

                if best_match:
                    node_id = best_match['id']
                    matched_text_ids.add(node_id)
                    obj_center_x = int((obj_bbox[0] + obj_bbox[2]) / 2)
                    obj_center_y = int((obj_bbox[1] + obj_bbox[3]) / 2)
                    final_nodes_map[node_id] = {
                        "id":node_id, "type":best_match['type'],
                        "position":{"x":obj_center_x, "y":obj_center_y},
                        "data":best_match['data'],
                        "actual_bbox_for_edge_calc": obj_bbox
                    }
                    print(f"Correlated obj '{obj.name}' with text '{best_match['data']['label']}'. Using obj bbox for pos. Original type: {best_match['type']}.")

        for txt_node in text_derived_nodes:
            if txt_node['id'] not in matched_text_ids:
                txt_bbox = get_bounding_box(txt_node['bounding_poly'])
                txt_center_x = int((txt_bbox[0] + txt_bbox[2]) / 2)
                txt_center_y = int((txt_bbox[1] + txt_bbox[3]) / 2)
                final_nodes_map[txt_node['id']] = {
                    "id":txt_node['id'], "type":txt_node['type'],
                    "position":{"x":txt_center_x, "y":txt_center_y},
                    "data":txt_node['data'],
                    "actual_bbox_for_edge_calc": txt_bbox
                }
        extracted_nodes = list(final_nodes_map.values())

        # --- Basic Edge Detection Heuristic ---
        edge_id_counter = 0
        if len(extracted_nodes) > 1:
            def get_node_center_from_pos(node_dict): # node_dict is the full node object
                 return (node_dict['position']['x'], node_dict['position']['y'])

            # Prepare nodes with their centers and bboxes for edge calculation
            nodes_for_edges = []
            for node_dict in extracted_nodes:
                nodes_for_edges.append({
                    'data': node_dict, # Full node data
                    'center': get_node_center_from_pos(node_dict), # Position is already center
                    'bbox': node_dict.get('actual_bbox_for_edge_calc') # Bbox for proximity
                })

            for i in range(len(nodes_for_edges)):
                node_a_info = nodes_for_edges[i]
                n_a = node_a_info['data']
                # c_a = node_a_info['center'] # Not strictly needed if using bbox logic
                bbox_a = node_a_info['bbox']
                if not bbox_a: # Fallback if no bbox was stored
                    c_a_x, c_a_y = n_a['position']['x'], n_a['position']['y']
                    bbox_a = (c_a_x - 50, c_a_y - 25, c_a_x + 50, c_a_y + 25)


                pot_targets = []
                for j in range(len(nodes_for_edges)):
                    if i == j: continue
                    node_b_info = nodes_for_edges[j]
                    n_b = node_b_info['data']
                    # c_b = node_b_info['center']
                    bbox_b = node_b_info['bbox']
                    if not bbox_b:
                        c_b_x, c_b_y = n_b['position']['x'], n_b['position']['y']
                        bbox_b = (c_b_x - 50, c_b_y - 25, c_b_x + 50, c_b_y + 25)

                    # Using center points for main logic, bbox for refined checks (not fully implemented here)
                    c_a_x, c_a_y = n_a['position']['x'], n_a['position']['y']
                    c_b_x, c_b_y = n_b['position']['x'], n_b['position']['y']


                    is_below,h_align,v_dist = c_b_y>c_a_y, abs(c_b_x-c_a_x)<75, c_b_y-c_a_y
                    is_right,v_align,h_dist = c_b_x>c_a_x, abs(c_b_y-c_a_y)<75, c_b_x-c_a_x

                    if is_below and h_align and 0 < v_dist < 300: # Ensure v_dist is positive
                        pot_targets.append({'n':n_b,'d':v_dist,'t':'v'})
                    if is_right and v_align and 0 < h_dist < 300 and n_a['type']=='decision':
                        pot_targets.append({'n':n_b,'d':h_dist,'t':'h'})

                pot_targets.sort(key=lambda x: (x['t']!='v', x['d']))

                if n_a['type']!='decision' and pot_targets:
                    target_n=pot_targets[0]['n']
                    edge_id_counter+=1; extracted_edges.append({"id":f"edge_h_{edge_id_counter}", "source":n_a['id'], "target":target_n['id']})
                    print(f"Edge (std): {n_a['id']}->{target_n['id']}")
                elif n_a['type']=='decision' and pot_targets:
                    yes_n=next((t['n'] for t in pot_targets if t['t']=='v'),None)
                    no_n=next((t['n'] for t in pot_targets if t['t']=='h'),None)
                    if yes_n and no_n and yes_n['id']==no_n['id']:
                        no_n = next((t['n'] for t in pot_targets[1:] if t['t']=='h' and t['n']['id']!=yes_n['id']),None) if len(pot_targets)>1 else None
                    if yes_n:
                        edge_id_counter+=1; extracted_edges.append({"id":f"edge_h_{edge_id_counter}_y", "source":n_a['id'], "target":yes_n['id'], "label":"Yes"})
                        print(f"Edge (dec yes): {n_a['id']}->{yes_n['id']}")
                    if no_n and (not yes_n or no_n['id']!=yes_n['id']):
                        edge_id_counter+=1; extracted_edges.append({"id":f"edge_h_{edge_id_counter}_n", "source":n_a['id'], "target":no_n['id'], "label":"No"})
                        print(f"Edge (dec no): {n_a['id']}->{no_n['id']}")
                    elif not yes_n and no_n:
                        edge_id_counter+=1; extracted_edges.append({"id":f"edge_h_{edge_id_counter}_p", "source":n_a['id'], "target":no_n['id']})

        final_payload = {"nodes": extracted_nodes, "edges": extracted_edges}
        print(f"analyze_image_content: Success. Nodes: {len(extracted_nodes)}, Edges: {len(extracted_edges)}")
        return final_payload

    except auth_exceptions.DefaultCredentialsError as e:
        print(f"CRITICAL ERROR: Google Cloud Default Credentials error in Vision API calls. Details: {e}")
        traceback.print_exc()
        raise Exception("Vision API Credentials Error during processing. Check server logs.")
    except Exception as e:
        print(f"CRITICAL ERROR: Unhandled exception in analyze_image_content. Details: {e}")
        traceback.print_exc()
        raise Exception(f"Chart Analysis Failed: {str(e)}")

# Example usage (for testing this file directly)
if __name__ == '__main__':
    print("flowchart_analyzer.py: To test with actual image processing, run through the FastAPI endpoint after setting up credentials.")
