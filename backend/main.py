from datetime import datetime, timezone # Added import
from typing import List, Optional # Added import
from fastapi import FastAPI, HTTPException, Request, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import google.generativeai as genai
import json
from dotenv import load_dotenv  # <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< IMPORT THIS
import firebase_admin
from firebase_admin import credentials, auth, db
from typing import Optional  # Added for Optional email in FirebaseUser

# LangChain imports
from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import LLMChain
# Using standard Pydantic for API data models
from pydantic import BaseModel, Field
import json # Ensure json is imported for potential parsing later

# --- .env DEBUG START ---
print("DEBUG: Script starting. Attempting to load .env file...")
# Construct explicit path, assuming main.py is in 'backend' and .env is also in 'backend'
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    # override=True ensures that if .env is found, its values are loaded even if system env vars exist.
    # For this debug, it helps confirm .env is being read.
    loaded_successfully = load_dotenv(dotenv_path=dotenv_path, override=True)
    print(
        f"DEBUG: Explicit load_dotenv(path='{dotenv_path}') attempted. Success: {loaded_successfully}")
else:
    print(
        f"DEBUG: .env file NOT FOUND at explicit path: {dotenv_path}. Trying default load_dotenv().")
    loaded_successfully = load_dotenv(override=True)  # Try default path
    print(
        f"DEBUG: Default load_dotenv() attempted. Success: {loaded_successfully}")

retrieved_api_key_immediately = os.environ.get("GEMINI_API_KEY")
if retrieved_api_key_immediately:
    print(
        f"DEBUG: GEMINI_API_KEY after load_dotenv: '{retrieved_api_key_immediately[:5]}...' (partially shown)")
else:
    print("DEBUG: GEMINI_API_KEY is NOT in os.environ immediately after load_dotenv() attempt.")
# --- .env DEBUG END ---

# Firebase Admin SDK Initialization
try:
    cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not cred_path:
        print("WARNING: GOOGLE_APPLICATION_CREDENTIALS environment variable not set. Firebase Admin SDK will not be initialized.")
        # Or raise an error if Firebase is critical for the app to start
    elif not os.path.exists(cred_path):  # Check if the path actually exists
        print(
            f"ERROR: Firebase credentials file not found at path: {cred_path}. Firebase Admin SDK will not be initialized.")
    else:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("INFO: Firebase Admin SDK initialized successfully.")
except Exception as e:
    print(f"ERROR: Failed to initialize Firebase Admin SDK: {e}")

app = FastAPI()

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://flowchart-to-code-learning.vercel.app",  # Frontend on Vercel
    # <-- Add your backend Render URL for completeness
    "https://flowchart-to-code-learning-1.onrender.com",
    "https://flowchart-learner-git-langchain-vinit-sources-projects.vercel.app",
    "https://flowchart-learner.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # More secure to list specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini API Configuration


def configure_gemini(gemini_version: str = "2.0") -> Optional[genai.GenerativeModel]:
    """
    Configures the Gemini API with the API key from environment variables.
    This function is called at the start of the application to ensure
    the Gemini SDK is ready for use.
    """
    global model  # Declare model as global to modify it in this function
    model = None  # Initialize model to None

    try:
        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        # This debug print is crucial
        if gemini_api_key:
            print(
                f"DEBUG: GEMINI_API_KEY FOUND in environment. Value: '{gemini_api_key[:5]}...' (partially shown)")
        else:
            print(
                "DEBUG: GEMINI_API_KEY NOT FOUND in os.environ during Gemini configuration.")

        if not gemini_api_key:
            raise KeyError(
                "GEMINI_API_KEY not found in environment. Please ensure it is set in your system environment (e.g., Render service environment variables) or in a 'backend/.env' file for local development.")

        genai.configure(api_key=gemini_api_key)
        print("INFO: Gemini SDK configured with API key.")

        # List available models (inside try block, after configure)
        print("INFO: Listing available Gemini models (if SDK configured)...")
        models_found_supporting_generate_content = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                models_found_supporting_generate_content.append(m.name)
                print(
                    f"  - Model Name: {m.name}, Supported: {m.supported_generation_methods}, Display: {m.display_name}")
        print("INFO: Finished listing models.")

        if not models_found_supporting_generate_content:
            print("WARNING: No models found supporting 'generateContent'. The chat functionality might not work as expected.")
            # Depending on strictness, you might raise an error or allow app to run with 'model = None'

        # Initialize a specific Gemini model - YOU MIGHT NEED TO CHANGE 'gemini-pro'
        # based on the output of list_models() above.
        # model_name_to_use = 'gemini-1.5-flash' # Old default

        # --- START MODIFICATION ---
        # Preferred model, including the 'models/' prefix as seen in the user's logs
        if gemini_version == "2.0":
            preferred_model_name = 'models/gemini-2.0-flash'
        elif gemini_version == "2.5":
            preferred_model_name = 'models/gemini-2.5-pro-preview-06-05'
        # Alternative if the preferred_model_name isn't found for some reason
        alternative_model_name = 'models/gemini-2.0-flash'

        model_name_to_use = None  # Will be set from available models

        if models_found_supporting_generate_content:
            if preferred_model_name in models_found_supporting_generate_content:
                model_name_to_use = preferred_model_name
                print(
                    f"INFO: Preferred model '{model_name_to_use}' is available.")
            elif alternative_model_name in models_found_supporting_generate_content:
                model_name_to_use = alternative_model_name
                print(
                    f"INFO: Preferred model not found. Using alternative '{model_name_to_use}'.")
            else:
                # Fallback to the first available model that supports 'generateContent'
                # This was the previous problematic behavior if preferred wasn't exactly 'gemini-pro'
                # Now it's a more informed fallback.
                model_name_to_use = models_found_supporting_generate_content[0]
                print(
                    f"WARNING: Preferred models ('{preferred_model_name}', '{alternative_model_name}') not found. Automatically selected first available model: '{model_name_to_use}'.")
        else:
            # No models support 'generateContent', so model cannot be initialized.
            print(f"ERROR: No models supporting 'generateContent' are available with your API key. Cannot initialize a model.")
            raise Exception(
                "No suitable Gemini model found for 'generateContent'.")

        model = genai.GenerativeModel(model_name_to_use)
        print(
            f"INFO: Gemini model '{model_name_to_use}' initialized successfully.")
        return model  # Return the initialized model

    except KeyError as e_key:
        # model remains None from its initialization at the top of the try block
        print(f"ERROR (KeyError): {str(e_key)}")
        print("       The AI features will not work. Example for .env: GEMINI_API_KEY=YOUR_KEY_HERE")
        return None  # Return None to indicate failure
    except Exception as e_gen:
        # model remains None
        print(f"ERROR (General Exception during Gemini Setup): {str(e_gen)}")
        print("       The AI features may not work correctly.")
        return None  # Return None to indicate failure

# --- LangChain Error Tutor Chain Definition ---

# Define the Pydantic models for the API response structure (used by /api/diagnose-flowchart-error)
# These will be populated from the LLM's JSON output.
class FlowchartPatch(BaseModel):
    nodes_to_add: List[dict] = Field(default_factory=list, description="List of new nodes (JSON objects) to add to the flowchart")
    edges_to_add: List[dict] = Field(default_factory=list, description="List of new edges (JSON objects) to add to the flowchart")

class TutorResponse(BaseModel):
    friendly_explanation: str = Field(description="Plain language explanation of the error for a student")
    suggested_fix: str = Field(description="One-liner suggestion for how to fix the error")
    flowchart_patch: Optional[FlowchartPatch] = Field(description="JSON object with nodes_to_add and edges_to_add to fix the flowchart. Set to null if no direct patch is possible.")

ERROR_TUTOR_TEMPLATE = """
You are a helpful teaching assistant for a flowchart programming application.
Given a flowchart (in JSON format) and a Python traceback that occurred when trying to run or simulate this flowchart,
your goal is to explain the error to a beginner student and suggest a fix.

You MUST return a JSON object matching the following schema:
{{
  "friendly_explanation": "string (explain the error in simple terms, relating it to the flowchart)",
  "suggested_fix": "string (a concise, actionable suggestion for the student to fix the flowchart)",
  "flowchart_patch": {{
    "nodes_to_add": [{{ "id": "new_node_1", "type": "NodeType", "label": "Node Label", "x": 0, "y": 0, ... }}],
    "edges_to_add": [{{ "id": "new_edge_1", "source": "node_id_1", "target": "node_id_2", "label": "optional_label" }}]
  }}
  OR null if no direct patch is possible or appropriate.
}}

Consider the context: The student is learning programming concepts through flowcharts.
The error might be due to missing nodes (e.g., an input variable used before declaration),
incorrect connections, or logical flaws that manifest as runtime errors.

Flowchart JSON:
{flowchart}

Python Traceback:
{traceback}

If the traceback is a NameError (e.g., "name 'input1' is not defined"), it likely means an Input node for 'input1' is missing,
or a variable was used before it was assigned a value in a Process node.
- For a missing Input:
  - friendly_explanation: "It looks like you're trying to use a variable, for example 'input1', in your flowchart, possibly in a Process or Decision node. However, I can't find where 'input1' gets its value. Variables need to be defined, usually by adding an Input node, before they can be used."
  - suggested_fix: "Add an Input node for the missing variable (e.g., 'input1') and connect it before the node where the error occurs."
  - flowchart_patch: {{ "nodes_to_add": [{{ "id": "new_input_node_for_variable", "type": "input", "label": "Input [variable_name]", "x": 100, "y": 100 }}], "edges_to_add": [] }} (Note: Edge patching can be complex, you might simplify or omit if too hard to determine programmatically from traceback alone. Focus on adding the node first.)

If the traceback is a ZeroDivisionError:
- friendly_explanation: "It seems your flowchart tried to divide a number by zero. This isn't mathematically possible and causes an error. This usually happens in a Process node where you have an expression like 'result = x / y', and 'y' was zero at that time."
- suggested_fix: "Check the Process node performing division. Ensure the variable you're dividing by (the denominator) cannot be zero. You might need to add a Decision node before it to check if the denominator is zero."
- flowchart_patch: null (Patching this might require adding a decision and new paths, which is complex. Explaining is better here.)

If no specific patch can be confidently generated (e.g., complex logical error, or if edge connections for a new node are ambiguous without more context), set flowchart_patch to null.
Prioritize a clear explanation and a general suggestion if a precise patch is too complex.

Return ONLY the JSON object.
"""

error_tutor_chain = None # Will be initialized after Gemini model

def get_error_tutor_chain():
    global error_tutor_chain
    if error_tutor_chain is None:
        # Ensure Gemini model is configured and available
        # Assuming 'model' is the global genai.GenerativeModel initialized by configure_gemini()
        # We need a Langchain compatible model instance.
        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        if not gemini_api_key:
            print("ERROR: GEMINI_API_KEY not found, cannot initialize error_tutor_chain.")
            return None

        try:
            # Using gemini-pro as it's generally available and good for structured output.
            # Adjust model name if needed, e.g. to a specific version like "gemini-1.5-flash-latest"
            # Ensure the model used here supports JSON mode if we want to enforce it strictly,
            # though the prompt itself requests JSON.
            llm = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=gemini_api_key,
                                         temperature=0.1, convert_system_message_to_human=True)

            prompt_template = PromptTemplate(
                input_variables=["flowchart", "traceback"],
                template=ERROR_TUTOR_TEMPLATE
            )
            error_tutor_chain = LLMChain(
                llm=llm,
                prompt=prompt_template,
                output_key="tutor_response_json_str" # Output will be a JSON string
            )
            print("INFO: LangChain error_tutor_chain initialized successfully.")
        except Exception as e:
            print(f"ERROR: Failed to initialize LangChain error_tutor_chain: {e}")
            return None
    return error_tutor_chain

# --- End LangChain Error Tutor Chain Definition ---


class ChatMessage(BaseModel):
    message: str
    exercise_id: Optional[str] = None
    exercise_title: Optional[str] = None

# Model for the new /api/diagnose-flowchart-error endpoint
class DiagnoseFlowchartErrorRequest(BaseModel):
    flowchart_json: dict # Expecting a parsed JSON object (dictionary)
    traceback: str

# Model for the /api/flowchart/patch endpoint
class ApplyFlowchartPatchRequest(BaseModel):
    current_flowchart: dict # The current flowchart state {"nodes": [...], "edges": [...]}
    patch: FlowchartPatch       # The patch object from TutorResponse

class UserDetails(BaseModel):
    last_active: datetime
    points: int
    tasks_completed: List[str]


class IdToken(BaseModel):
    token: str


class FirebaseUser(BaseModel):
    uid: str
    email: Optional[str] = None


class AuthenticatedUser(BaseModel):
    uid: str
    email: str

# Security scheme for Bearer token
oauth2_scheme = HTTPBearer()
ALLOWED_DOMAIN = "navgurukul.org"

async def get_current_user_data(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)) -> AuthenticatedUser:
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        if not email or not uid:
            raise HTTPException(status_code=401, detail="UID or Email not found in token.")
        if not email.endswith(f"@{ALLOWED_DOMAIN}"):
            raise HTTPException(status_code=403, detail=f"Access restricted to {ALLOWED_DOMAIN} domain.")
        return AuthenticatedUser(uid=uid, email=email)
    except firebase_admin.auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except HTTPException as http_exc:
        raise http_exc # Re-raise HTTPException explicitly
    except Exception as e:
        # Log the exception for server-side review
        print(f"Error during token verification or domain check: {e}")
        raise HTTPException(
            status_code=500, # Keep this for genuinely unexpected errors
            detail="Could not verify authentication credentials."
        )


@app.get("/")
async def read_root():
    return {"status": "API is running"}

# Models for image import response
class Node(BaseModel):
    id: str
    type: str # Should match frontend FlowchartNodeType: 'start', 'end', 'process', 'decision', 'input', 'output', 'loop'
    label: str
    x: int
    y: int
    width: int
    height: int

class Edge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None

class FlowchartResponse(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    error: Optional[str] = None
    fallback_used: Optional[bool] = False

@app.post("/api/import-image", response_model=FlowchartResponse)
async def import_image(file: UploadFile = File(...)):
    """
    Accepts an image file, processes it (placeholder), and returns flowchart nodes and edges.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image format. Only JPG/PNG accepted for now.")

    # --- CV Model and OCR Processing ---

    # Configuration - User must update MODEL_CLASS_NAMES
    # Assumes 'flowcharts.pt' will be placed in the 'backend/' directory by the user.
    MODEL_PATH = "flowcharts.pt"
    # !!! IMPORTANT: User MUST replace this with their actual class names in the correct order !!!
    # Example: MODEL_CLASS_NAMES = ['rectangle', 'diamond', 'oval_start', 'oval_end', 'arrow']
    MODEL_CLASS_NAMES = ['start', 'end', 'process', 'decision', 'input', 'output', 'arrow'] # Placeholder
    CONFIDENCE_THRESHOLD = 0.7 # As per acceptance criteria

    # 1. Load YOLO Model
    try:
        # Check if model file exists
        if not os.path.exists(MODEL_PATH):
            print(f"ERROR: Model file not found at {MODEL_PATH}. Please ensure 'flowcharts.pt' is in the 'backend/' directory.")
            raise HTTPException(status_code=503, detail=f"CV Model file not found at {MODEL_PATH}. Please ensure it is uploaded.")

        yolo_model = YOLO(MODEL_PATH)
        # Override class names if yolo_model.names is different or to ensure consistency
        # yolo_model.names = {i: name for i, name in enumerate(MODEL_CLASS_NAMES)} # This might be needed if model has internal names
        print(f"DEBUG: YOLOv8 model loaded from {MODEL_PATH}. Model classes (from yolo_model.names): {yolo_model.names if hasattr(yolo_model, 'names') else 'Not available'}")
        print(f"DEBUG: Using configured MODEL_CLASS_NAMES for mapping: {MODEL_CLASS_NAMES}")

    except Exception as e:
        print(f"Error loading YOLOv8 model from {MODEL_PATH}: {e}")
        # Log the full exception for more details if needed
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=503, detail=f"CV Model not available or failed to load: {str(e)}")

    # 2. Process Uploaded Image
    try:
        contents = await file.read()
        pil_image = Image.open(io.BytesIO(contents))
        print(f"DEBUG: Image loaded into PIL. Format: {pil_image.format}, Size: {pil_image.size}, Mode: {pil_image.mode}")
        # Convert to RGB if it's RGBA or P (palette) to avoid issues with some models/libraries
        if pil_image.mode in ('RGBA', 'P'):
            pil_image = pil_image.convert('RGB')
            print(f"DEBUG: Image converted to RGB.")

    except Exception as e:
        print(f"Error processing/reading image: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted image file: {str(e)}")

    # 3. Perform Inference
    try:
        results = yolo_model(pil_image) # Returns a list of Results objects
        print(f"DEBUG: YOLOv8 inference completed. Number of result sets: {len(results)}")
    except Exception as e:
        print(f"Error during YOLOv8 inference: {e}")
        raise HTTPException(status_code=500, detail=f"Error during CV model inference: {str(e)}")

    # 4. Extract and Filter Detections
    processed_nodes: List[Node] = []
    # detected_arrows_info = [] # For later edge creation

    if results and len(results) > 0:
        # Assuming results[0] contains the detections for the single image
        detections = results[0].boxes
        print(f"DEBUG: Detections object type: {type(detections)}")
        print(f"DEBUG: Number of raw boxes found: {len(detections.xyxy)}")

        for i in range(len(detections.xyxy)):
            box = detections.xyxy[i].tolist() # [x1, y1, x2, y2]
            conf = float(detections.conf[i])
            cls_id = int(detections.cls[i])

            if conf >= CONFIDENCE_THRESHOLD:
                try:
                    # Use the model's internal class names if available and map, otherwise use configured list directly
                    # This depends on how yolo_model.names is structured and if it matches MODEL_CLASS_NAMES indices
                    # Safest is to rely on MODEL_CLASS_NAMES index if yolo_model.names isn't directly usable or is just numbers
                    class_name = MODEL_CLASS_NAMES[cls_id] if cls_id < len(MODEL_CLASS_NAMES) else f"class_{cls_id}"

                    # If yolo_model.names is a dict like {0: 'class_a', 1: 'class_b'}, use it:
                    # if hasattr(yolo_model, 'names') and isinstance(yolo_model.names, dict) and cls_id in yolo_model.names:
                    #    class_name = yolo_model.names[cls_id]
                    # else: # Fallback to list if dict access fails or names not a dict
                    #    class_name = MODEL_CLASS_NAMES[cls_id] if cls_id < len(MODEL_CLASS_NAMES) else f"class_{cls_id}"

                    print(f"DEBUG: Detected: class_id={cls_id}, class_name='{class_name}', conf={conf:.2f}, box={box}")
                except IndexError:
                    print(f"WARNING: class_id {cls_id} is out of range for MODEL_CLASS_NAMES (len: {len(MODEL_CLASS_NAMES)}). Skipping.")
                    continue

                # For now, we only create nodes from non-arrow shapes. OCR will provide better labels later.
                # The 'type' field for the Node should be a FlowchartNodeType (e.g., 'start', 'process')
                # This requires mapping from model's detected class_name to FlowchartNodeType
                # Example mapping (NEEDS TO BE ADJUSTED BASED ON YOUR ACTUAL MODEL_CLASS_NAMES)
                node_type_mapping = {
                    'start': 'start', 'oval_start': 'start', # Example model class name -> frontend type
                    'end': 'end', 'oval_end': 'end',
                    'process': 'process', 'rectangle': 'process',
                    'decision': 'decision', 'diamond': 'decision',
                    'input': 'input', 'parallelogram_input': 'input', 'io': 'input', # if 'io' is generic
                    'output': 'output', 'parallelogram_output': 'output',
                    # 'arrow' type shapes are handled separately for edges, not as nodes here
                }

                # For now, directly use class_name if it's a valid FlowchartNodeType, otherwise map or skip
                # This assumes your MODEL_CLASS_NAMES are already the frontend types or you have a mapping
                # For this step, we'll assume direct mapping for simplicity if class_name is not 'arrow'.

                if class_name.lower() != 'arrow': # Or however your arrow class is named
                    # TODO: Implement robust mapping from `class_name` to `FlowchartNodeType`
                    # For now, let's assume class_name IS the FlowchartNodeType if it's not an arrow
                    # This is a placeholder and needs refinement based on actual class names.
                    node_type_candidate = class_name.lower()

                    # A more robust mapping based on common patterns:
                    if "start" in node_type_candidate: current_node_type = "start"
                    elif "end" in node_type_candidate: current_node_type = "end"
                    elif "process" in node_type_candidate or "rect" in node_type_candidate: current_node_type = "process"
                    elif "decision" in node_type_candidate or "diamond" in node_type_candidate: current_node_type = "decision"
                    elif "input" in node_type_candidate or "parallelogram" in node_type_candidate: current_node_type = "input" # Default "io" to input
                    elif "output" in node_type_candidate: current_node_type = "output" # More specific output
                    else:
                        print(f"WARNING: Class name '{class_name}' not directly mappable to a standard FlowchartNodeType for creating a node. Skipping this shape as a node.")
                        continue # Skip if not a recognized shape for a node

                    x1, y1, x2, y2 = box
                    node = Node(
                        id=f"cv-node-{len(processed_nodes)}",
                        type=current_node_type, # This needs to be a valid FlowchartNodeType
                        label=f"Detected: {class_name}", # Placeholder label, OCR will replace
                        x=int(x1),
                        y=int(y1),
                        width=int(x2 - x1),
                        height=int(y2 - y1)
                    )
                    processed_nodes.append(node)
                # else:
                #     detected_arrows_info.append({'box': box, 'class_name': class_name, 'conf': conf})
            else:
                print(f"DEBUG: Skipped low confidence detection: class_id={cls_id}, conf={conf:.2f}")

        print(f"DEBUG: Total processed nodes (shapes) after CV: {len(processed_nodes)}")
    else:
        print("DEBUG: No results from YOLO model or results list is empty.")


    # 5. Placeholder for OCR (to be implemented in next step)
    # For each node in processed_nodes, crop image and run OCR to update label.

    # 6. Placeholder for Edge Creation (to be implemented after node finalization and arrow processing)
    processed_edges: List[Edge] = []

    # 7. Implement Fallback Logic (placeholder)
    # overall_confidence = calculate_overall_confidence(processed_nodes) # Needs implementation
    # MIN_SHAPE_DETECT_THRESHOLD = 1 # Example: if less than 1 shape, consider it low confidence
    # if not processed_nodes or len(processed_nodes) < MIN_SHAPE_DETECT_THRESHOLD: # or overall_confidence < 0.4:
    #     print("DEBUG: Fallback triggered due to low confidence or too few shapes detected.")
    #     fallback_nodes = [
    #         Node(id="fallback-1", type="start", label="Start ML (Fallback)", x=50, y=50, width=100, height=40),
    #         Node(id="fallback-2", type="process", label="Process ML Data (Fallback)", x=50, y=150, width=150, height=60),
    #         Node(id="fallback-3", type="end", label="End ML (Fallback)", x=50, y=250, width=100, height=40),
    #     ]
    #     fallback_edges = [
    #         Edge(id="fallback-edge-1", source="fallback-1", target="fallback-2"),
    #         Edge(id="fallback-edge-2", source="fallback-2", target="fallback-3"),
    #     ]
    #     return FlowchartResponse(
    #         nodes=fallback_nodes,
    #         edges=fallback_edges,
    #         error="Couldn’t recognise that sketch—try a clearer photo.",
    #         fallback_used=True
    #     )

    # Return detected nodes (edges are empty for now)
    if not processed_nodes: # If no nodes were processed (e.g. only arrows detected or all low conf)
         return FlowchartResponse(
            nodes=[Node(id="empty-1", type="process", label="No shapes detected clearly.", x=50, y=50, width=200, height=40)],
            edges=[],
            error="No flowchart shapes were detected with sufficient confidence.",
            fallback_used=True # Consider this a type of fallback
        )

    return FlowchartResponse(nodes=processed_nodes, edges=processed_edges)


    # Example of returning the fallback response (as per Acceptance Criteria 6)
    # This also uses frontend-compatible types now.
    # return FlowchartResponse(
    #     nodes=[
    #         Node(id="fallback-1", type="start", label="Start ML (Fallback)", x=50, y=50, width=100, height=40),
    #         Node(id="fallback-2", type="process", label="Process ML Data (Fallback)", x=50, y=150, width=150, height=60),
    #         Node(id="fallback-3", type="end", label="End ML (Fallback)", x=50, y=250, width=100, height=40),
    #     ],
    #     edges=[
    #         Edge(id="fallback-edge-1", source="fallback-1", target="fallback-2"),
    #         Edge(id="fallback-edge-2", source="fallback-2", target="fallback-3"),
    #     ],
    #     error="Couldn’t recognise that sketch—try a clearer photo.", # Toast message
    #     fallback_used=True
    # )

    # Example of returning an error (as per Error Handling section)
    # raise HTTPException(status_code=400, detail="Invalid image format.") # For 4xx
    # raise HTTPException(status_code=500, detail="Importer offline, please try again later.") # For 5xx


@app.post("/api/chat")
async def handle_chat_message(chat_message: ChatMessage): # Removed current_user dependency
    # print(f"User {current_user.email} (UID: {current_user.uid}) accessing chat.") # Commented out as current_user is removed
    user_message = chat_message.message.strip()
    response_text = ""
    is_structured_data = False

    try:
        if user_message.lower().startswith("/learn "):
            topic = user_message[len("/learn "):].strip()

            if not topic:
                response_text = "Please specify a topic after /learn. For example: /learn loops"
            else:
                context_prefix = ""
                if chat_message.exercise_title:
                    context_prefix = f"Within the context of the exercise titled '{chat_message.exercise_title}', "
                    print(f"DEBUG: Received exercise context: ID='{chat_message.exercise_id}', Title='{chat_message.exercise_title}'")

                prompt = (
                    f"{context_prefix}Explain the programming concept of '{topic}' clearly and concisely, as if to a beginner learning about flowcharts.\n"
                    f"Your explanation should include:\n"
                    f"1. A definition of the concept.\n"
                    f"2. How it is typically represented in a flowchart (mention symbol types if specific).\n"
                    f"3. A very simple pseudo-code or code example (e.g., Python or JavaScript) to illustrate its use.\n"
                    f"4. One or two key takeaways or common pitfalls related to '{topic}'.\n"
                    f"Focus on educational value and clarity. Use markdown for formatting if it helps readability (e.g., for lists or code blocks)."
                )
                # Print first 100 chars for brevity
                print(f"DEBUG: topic '{topic[:100]}' with context prefix: '{context_prefix[:100]}'")

                # Ensure model is configured
                print("DEBUG: Attempting to configure Gemini model for '/learn' command...")
                model = configure_gemini(gemini_version="2.0")
                if model is None:
                    print("ERROR: Gemini model is None after configuration attempt in '/learn'.")
                    raise HTTPException(
                        status_code=503, detail="AI Service not configured or model not available. Critical: GEMINI_API_KEY might be missing or invalid in the deployment environment (e.g., Render settings). Also, check model availability for your key.")

                print(f"DEBUG: Gemini model object before calling generate_content_async: {model}")
                ai_response = await model.generate_content_async(prompt)
                # Print first 100 chars for brevity
                print(f"DEBUG: AI response received: {ai_response.text[:100]}...")
            response_text = ai_response.text
        elif user_message.lower().startswith("/generate "):
            description = user_message[len("/generate "):].strip()
            if not description:
                response_text = "Please provide a description after /generate. For example: /generate a flowchart for making tea"
            else:
                prompt = (
                    f"Generate a complete flowchart solution for: \"{description}\"\n\n"
                    "RETURN ONLY VALID JSON matching this EXACT schema:\n{\n  \"nodes\": [{\"id\": \"unique_string\", \"type\": \"terminal|process|decision|input|output\", \"label\": \"text\", \"x\": number, \"y\": number}],\n  \"edges\": [{\"id\": \"unique_string\", \"source\": \"node_id\", \"target\": \"node_id\", \"label\": \"Yes|No|empty\"}],\n  \"problemStatement\": \"clear 1-2 sentence description\",\n  \"inputType\": \"single|multiple|array|object\",\n  \"outputType\": \"number|string|boolean|array|object\",\n  \"sampleInputs\": [\"input1\", \"input2\", \"input3\"],\n  \"sampleOutputs\": [\"output1\", \"output2\", \"output3\"]\n}\n\nCONSISTENCY RULES:\n1. STANDARD PATTERNS for common algorithms:\n   - Fibonacci: Start(1400,1200) → Input n → Check \"n <= 1\" → [Yes: Return n] [No: Calculate iteratively] → Output → End\n   - Factorial: Start(1400,1200) → Input n → Check \"i <= n\" →  [Yes: Calculate factorial = i*factorial] [No: Return 1] → Output → End\n   - Prime Check: Start(1400,1200) → Input n → Check \"n <= 1\" → [Yes: Return false] [No: Loop check divisibility] → Output → End\n   - Even/Odd: Start(1400,1200) → Input n → Check \"n % 2 == 0\" → [Yes: Return \"Even\"] [No: Return \"Odd\"] → End\n\n2. POSITIONING: Start at (1400,1200), space adjacent nodes 150px vertically, 250px horizontally from each other\n3. NAMING: Use standard variables: n, result, i, temp, a, b. Be specific in process nodes.\n4. DECISIONS: Always use \"Yes\"/\"No\" labels, clear conditions like \"n <= 1\", \"i < n\", \"num % 2 == 0\"\n5. FLOW: Logical sequence - Start → Input → Process/Decision → Output → End\n6. LABELS: Process nodes: \"variable = expression\", Input: \"Read variable\", Output: \"Display result\"\n\nSAMPLE DATA RULES:\n- Provide exactly 3 test cases\n- sampleInputs must match inputType format (single=string/number, array=JSON array, object=JSON object)\n- sampleOutputs must match expected results and outputType\n- Use realistic, diverse test cases including edge cases\n\nEXAMPLE: For \"check if number is even\": inputType=\"single\", outputType=\"boolean\", sampleInputs=[\"4\",\"7\",\"0\"], sampleOutputs=[\"true\",\"false\",\"true\"]"
                )
                # Define the JSON schema for flowchart responses
                response_schema = {
                    "type": "object",
                    "properties": {
                        "nodes": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "string"},
                                    "type": {"type": "string", "enum": ["terminal", "process", "decision", "input", "output"]},
                                    "label": {"type": "string"},
                                    "x": {"type": "number"},
                                    "y": {"type": "number"}
                                },
                                "required": ["id", "type", "label", "x", "y"]
                            }
                        },
                        "edges": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "string"},
                                    "source": {"type": "string"},
                                    "target": {"type": "string"},
                                    "label": {"type": "string"}
                                },
                                "required": ["id", "source", "target"]
                            }
                        },
                        "problemStatement": {"type": "string"},
                        "inputType": {"type": "string", "enum": ["single", "multiple", "array", "object"]},
                        "outputType": {"type": "string", "enum": ["number", "string", "boolean", "array", "object"]},
                        "sampleInputs": {"type": "array", "items": {"type": "string"}},
                        "sampleOutputs": {"type": "array", "items": {"type": "string"}}
                    },
                    "required": ["nodes", "edges", "problemStatement", "inputType", "outputType", "sampleInputs", "sampleOutputs"]
                }

                # Create generation config with the schema
                generation_config = genai.GenerationConfig(
                    temperature=0.1,
                    top_p=0.8,
                    top_k=40,
                    stop_sequences=[],
                    response_mime_type="application/json",
                    response_schema=response_schema,
                    candidate_count=1
                )
                print("DEBUG: Attempting to configure Gemini model for '/generate' command with version 2.0 (e.g., gemini-2.0-flash)...")
                model = configure_gemini(gemini_version="2.0") # Changed from "2.5" to "2.0"
                if model is None:
                    print("ERROR: Gemini model is None after configuration attempt in '/generate' with version 2.0.")
                    raise HTTPException(
                        status_code=503, detail="AI Service not configured or model not available. Critical: GEMINI_API_KEY might be missing or invalid in the deployment environment (e.g., Render settings). Also, check model availability for your key."
                    )

                print(f"DEBUG: Gemini model object before calling generate_content_async: {model}")
                # Pass the generation config to generate_content_async
                ai_response = await model.generate_content_async(prompt, generation_config=generation_config)
                try:
                    potential_json = ai_response.text
                    if potential_json.strip().startswith("```json"):
                        potential_json = potential_json.strip()[7:-3].strip()
                    elif potential_json.strip().startswith("```"):
                        potential_json = potential_json.strip()[3:-3].strip()
                    parsed_json = json.loads(potential_json)
                    if isinstance(parsed_json, dict) and \
                       'nodes' in parsed_json and isinstance(parsed_json['nodes'], list) and \
                       'edges' in parsed_json and isinstance(parsed_json['edges'], list):
                        response_text = json.dumps(parsed_json, indent=2)
                        is_structured_data = True
                    else:
                        response_text = ai_response.text
                except Exception:
                    response_text = ai_response.text
        else:
            response_text = "Sorry, I can only respond to `/learn <topic>` and `/generate <description>` commands at the moment."

    except Exception as e:
        print(f"Error during AI content generation: {e}")
        raise HTTPException(
            status_code=500, detail=f"An error occurred while processing your request with the AI: {str(e)}")

    return {"response": response_text, "isStructuredData": is_structured_data}

@app.post("/api/diagnose-flowchart-error", response_model=Optional[TutorResponse])
async def diagnose_flowchart_error(error_data: DiagnoseFlowchartErrorRequest):
    """
    Receives flowchart JSON and a traceback string, then uses the LLM tutor chain
    to generate an explanation, a suggested fix, and a potential patch.
    """
    tutor_chain = get_error_tutor_chain()
    if not tutor_chain:
        raise HTTPException(status_code=503, detail="Error tutor service is not available.")

    try:
        # Convert flowchart_json from dict to string for the chain
        flowchart_str = json.dumps(error_data.flowchart_json, indent=2)

        # Invoke the chain
        # The chain is expected to return a dictionary with the key "tutor_response_json_str"
        chain_result = await tutor_chain.arun(flowchart=flowchart_str, traceback=error_data.traceback)

        if not chain_result:
            raise HTTPException(status_code=500, detail="Error tutor chain returned an empty result.")

        # The result from arun with a single output key is directly the value of that key
        tutor_response_json_str = chain_result

        print(f"DEBUG: Tutor chain raw JSON string response: {tutor_response_json_str}")

        # Parse the JSON string response into our Pydantic model
        parsed_response_data = json.loads(tutor_response_json_str)
        tutor_response_obj = TutorResponse(**parsed_response_data)

        return tutor_response_obj

    except json.JSONDecodeError as e:
        print(f"ERROR: Failed to parse JSON response from tutor chain: {e}")
        print(f"Raw response was: {tutor_response_json_str}")
        # Return a structured error or re-raise, maybe provide the raw string if helpful for debugging
        raise HTTPException(status_code=500, detail=f"Failed to parse JSON response from tutor chain. Raw response: {tutor_response_json_str}")
    except Exception as e:
        print(f"Error during error diagnosis: {e}")
        # Log the full traceback for server-side debugging
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred during error diagnosis: {str(e)}")


@app.post("/api/flowchart/patch")
async def patch_flowchart(request_data: ApplyFlowchartPatchRequest):
    """
    Applies a patch (nodes_to_add, edges_to_add) to a given flowchart.
    Returns the modified flowchart.
    """
    current_flowchart = request_data.current_flowchart
    patch = request_data.patch

    # Ensure current_flowchart has 'nodes' and 'edges' keys
    if "nodes" not in current_flowchart or not isinstance(current_flowchart["nodes"], list):
        current_flowchart["nodes"] = []
    if "edges" not in current_flowchart or not isinstance(current_flowchart["edges"], list):
        current_flowchart["edges"] = []

    # Add new nodes
    if patch.nodes_to_add:
        # Basic validation: check for required fields in nodes to add (id, type, label, x, y)
        for node in patch.nodes_to_add:
            if not all(k in node for k in ("id", "type", "label", "x", "y")):
                raise HTTPException(status_code=400, detail=f"Invalid node structure in patch: {node}. Missing required keys.")
            # Check for duplicate node IDs before adding
            if any(existing_node["id"] == node["id"] for existing_node in current_flowchart["nodes"]):
                raise HTTPException(status_code=400, detail=f"Duplicate node ID '{node['id']}' found in patch when trying to add to existing nodes.")
        current_flowchart["nodes"].extend(patch.nodes_to_add)

    # Add new edges
    if patch.edges_to_add:
        # Basic validation: check for required fields in edges to add (id, source, target)
        for edge in patch.edges_to_add:
            if not all(k in edge for k in ("id", "source", "target")):
                raise HTTPException(status_code=400, detail=f"Invalid edge structure in patch: {edge}. Missing required keys.")
            # Check for duplicate edge IDs before adding
            if any(existing_edge["id"] == edge["id"] for existing_edge in current_flowchart["edges"]):
                raise HTTPException(status_code=400, detail=f"Duplicate edge ID '{edge['id']}' found in patch when trying to add to existing edges.")

            # Optional: Check if source and target nodes for new edges exist
            node_ids = {node["id"] for node in current_flowchart["nodes"]}
            if edge["source"] not in node_ids:
                raise HTTPException(status_code=400, detail=f"Source node '{edge['source']}' for new edge '{edge['id']}' not found in flowchart.")
            if edge["target"] not in node_ids:
                raise HTTPException(status_code=400, detail=f"Target node '{edge['target']}' for new edge '{edge['id']}' not found in flowchart.")

        current_flowchart["edges"].extend(patch.edges_to_add)

    # TODO: Consider more sophisticated patch operations if needed (e.g., modify, delete nodes/edges)
    # For now, only additive patches are handled as per the design document's `FlowchartPatch` spec.

    return current_flowchart


@app.post("/api/auth/google")
async def google_auth(request: Request):
    data = await request.json()
    token = data.get("token")
    if not token:
        return JSONResponse(status_code=400, content={"detail": "No token provided"})
    # Optionally: verify token with Firebase Admin SDK here
    return {"status": "ok"}


@app.post("/auth/google", response_model=FirebaseUser)
async def auth_google_signin(id_token_body: IdToken):
    token_string = id_token_body.token
    try:
        # Note: verify_id_token is synchronous.
        # If this becomes a performance bottleneck, consider running it in a thread pool:
        # from fastapi.concurrency import run_in_threadpool
        # decoded_token = await run_in_threadpool(auth.verify_id_token, token_string)
        decoded_token = auth.verify_id_token(token_string)
        uid = decoded_token['uid']
        email = decoded_token.get('email')

        if not email:
            raise HTTPException(status_code=400, detail="Email not found in token.")

        if not email.endswith('@navgurukul.org'):
            raise HTTPException(status_code=403, detail="Access restricted to navgurukul.org domain.")

        # Here you would typically create or update the user in your database
        return FirebaseUser(uid=uid, email=email)
    except firebase_admin.auth.InvalidIdTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid ID token: {e}")
    except HTTPException as http_exc: # Re-raise HTTPException
        raise http_exc
    except Exception as e:  # Catch other potential errors during token verification
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {e}")


@app.get("/users/{user_id}/details", response_model=UserDetails)
async def get_user_details(user_id: str, current_user: AuthenticatedUser = Depends(get_current_user_data)):
    # Now current_user.uid contains the UID of the authenticated user.
    # And current_user.email contains their email.
    # The domain check is already handled by get_current_user_data.

    if current_user.uid != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this user's details.")

    print(f"User {current_user.email} (UID: {current_user.uid}) requesting details for {user_id}.")

    try:
        # Ensure Firebase Admin SDK is initialized
        if not firebase_admin._apps:
            # This is a fallback, ideally initialization happens at startup
            cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                print("INFO: Firebase Admin SDK re-initialized in get_user_details (fallback).")
            else:
                raise HTTPException(status_code=500, detail="Firebase Admin SDK not initialized and credentials missing.")

        user_progress_ref = db.reference(f'userProgress/{user_id}')
        progress_data = user_progress_ref.get()

        if progress_data:
            # Convert tasks_completed from numbers to strings if necessary,
            # or ensure they are stored as strings if that's what UserDetails expects.
            # Based on StudentProgress, completedExercises are numbers.
            # UserDetails expects tasks_completed as List[str].
            # This is a mismatch. For now, I will adapt to UserDetails, but this might need further review.
            tasks_completed_str = [str(ex_id) for ex_id in progress_data.get("completedExercises", [])]

            # Ensure last_active is a datetime object
            last_active_iso = progress_data.get("lastAccessedAt", datetime.now(timezone.utc).isoformat())
            try:
                last_active_dt = datetime.fromisoformat(last_active_iso.replace("Z", "+00:00"))
            except ValueError: # Handle cases where it might not be full ISO format
                 last_active_dt = datetime.strptime(last_active_iso, "%Y-%m-%dT%H:%M:%S.%fZ") if '.' in last_active_iso else datetime.fromisoformat(last_active_iso)


            user_details = UserDetails(
                last_active=last_active_dt,
                points=progress_data.get("totalScore", 0),
                tasks_completed=tasks_completed_str # Store as list of strings of exercise IDs
            )
            return user_details
        else:
            # Return default UserDetails if no progress found, or raise 404
            # For consistency with frontend's defaultInitialProgress:
            return UserDetails(
                last_active=datetime.utcnow(),
                points=0,
                tasks_completed=[]
            )
    except Exception as e:
        print(f"Error fetching user details from Firebase: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user details: {str(e)}")


@app.get("/api/online-users")
async def get_online_users():
    try:
        ref = db.reference("/status")
        status_data = ref.get()

        if status_data is None or not isinstance(status_data, dict):
            count = 0
        else:
            count = 0
            for user_status in status_data.values(): # Iterate through the values (dictionaries for each user)
                if isinstance(user_status, dict) and user_status.get("online") is True:
                    count += 1

        return {"online_users": count}
    except Exception as e:
        # Log the error for debugging
        print(f"Error accessing Firebase Realtime Database: {e}")
        # Return a generic error message to the client
        raise HTTPException(status_code=500, detail="Failed to retrieve online user count from the database.")

# Comments for running the app
# To run this application:
# 1. Make sure you are in the 'backend' directory in your terminal.
# 2. Create a virtual environment: python -m venv venv
# 3. Activate it:
#    - Windows: venv\Scripts\activate
#    - macOS/Linux: source venv/bin/activate
# 4. Install dependencies: pip install -r requirements.txt
# 5. Set your GEMINI_API_KEY:
#    - Create a file named '.env' in this 'backend' directory.
#    - Add the line: GEMINI_API_KEY=YOUR_ACTUAL_API_KEY
#    OR set it as a system environment variable.
# 6. Run the server: uvicorn main:app --reload --port 8000
