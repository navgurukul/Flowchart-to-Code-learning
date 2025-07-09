import unittest
from unittest.mock import patch
from flowchart_analyzer import analyze_image_content

class TestFlowchartAnalyzer(unittest.TestCase):

    @patch('google.cloud.vision.ImageAnnotatorClient')
    def test_analyze_image_content_mock_structure(self, MockImageAnnotatorClient):
        """
        Tests the basic structure of the mock response from analyze_image_content.
        Ensures that even with the client call, it proceeds to return mock data.
        """
        # Mock the client instance to prevent actual credential checks or API calls
        mock_client_instance = MockImageAnnotatorClient.return_value

        # Ensure the mocked response doesn't indicate an error for this test
        mock_response = unittest.mock.Mock()
        mock_response.error.message = None
        # Provide minimal structure needed by analyze_image_content if it tries to access other parts of response
        mock_response.full_text_annotation = None # Or a more detailed mock if needed by the path taken
        mock_response.text_annotations = []
        mock_client_instance.document_text_detection.return_value = mock_response


        dummy_image_bytes = b"dummy_image_data"

        # This test originally tested the old hardcoded mock data.
        # Now it tests that with a successful (but empty) API response,
        # it returns an empty flowchart.
        result = analyze_image_content(dummy_image_bytes)

        self.assertIsInstance(result, dict)
        self.assertIn("nodes", result)
        self.assertIsInstance(result["nodes"], list)
        self.assertIn("edges", result)
        self.assertIsInstance(result["edges"], list)

        if result["nodes"]:
            for node in result["nodes"]:
                self.assertIn("id", node)
                self.assertIn("type", node)
                self.assertIn("position", node)
                self.assertIsInstance(node["position"], dict)
                self.assertIn("x", node["position"])
                self.assertIn("y", node["position"])
                self.assertIn("data", node)
                self.assertIsInstance(node["data"], dict)
                self.assertIn("label", node["data"])

        if result["edges"]:
            for edge in result["edges"]:
                self.assertIn("id", edge)
                self.assertIn("source", edge)
                self.assertIn("target", edge)

    @patch('google.cloud.vision.ImageAnnotatorClient')
    def test_analyze_image_content_with_mock_vision_api(self, MockImageAnnotatorClient):
        """
        A placeholder for testing with a mocked Google Cloud Vision API.
        This test would be relevant when the actual API calls are implemented.
        """
        # Mock the client and its methods
        mock_client_instance = MockImageAnnotatorClient.return_value

        # Example: Mocking text_detection response
        mock_text_detection_response = unittest.mock.Mock()
        mock_text_detection_response.text_annotations = [] # Provide mock annotations
        mock_text_detection_response.full_text_annotation = None # Provide mock full text annotation
        mock_client_instance.text_detection.return_value = mock_text_detection_response

        # Example: Mocking object_localization response (if used)
        # mock_object_localization_response = unittest.mock.Mock()
        # mock_object_localization_response.localized_object_annotations = []
        # mock_client_instance.object_localization.return_value = mock_object_localization_response

        # Call the function with dummy data
        # dummy_image_bytes = b"some_image_bytes"
        # result = analyze_image_content(dummy_image_bytes)

        # self.assertIsNotNone(result)
        # Add more assertions based on expected processing of mock API responses

        # For now, as analyze_image_content returns hardcoded mock data and Vision API is commented out,
        # this test mostly ensures the patching setup is understood.
        # If analyze_image_content is modified to use the client, this test becomes active.
        # self.assertTrue(True, "Placeholder test for full Vision API mocking. Activate when API calls are implemented in flowchart_analyzer.py.")

        # Test with an empty response (no text detected)
        mock_empty_response = unittest.mock.Mock()
        mock_empty_response.text_annotations = []
        mock_empty_response.full_text_annotation = None
        mock_empty_response.error.message = None # Crucial: no error for this path
        mock_client_instance.document_text_detection.return_value = mock_empty_response

        result_empty = analyze_image_content(b"empty_image")
        self.assertEqual(result_empty, {"nodes": [], "edges": []})

        # Test with a simple text block
        # Create mock objects for Page, Block, Paragraph, Word, Symbol, Vertex
        Symbol = lambda: unittest.mock.Mock()  # Factory for Symbol mocks
        Word = lambda: unittest.mock.Mock()    # Factory for Word mocks
        Paragraph = lambda: unittest.mock.Mock() # Factory for Paragraph mocks
        Block = lambda: unittest.mock.Mock()   # Factory for Block mocks
        Page = lambda: unittest.mock.Mock()    # Factory for Page mocks

        def create_vertex_mock(x_val, y_val):
            v = unittest.mock.Mock()
            v.x = x_val
            v.y = y_val
            return v

        # Mock structure for "Start" text block
        start_symbol_s = Symbol()
        start_symbol_s.text = "S"
        start_symbol_t = Symbol()
        start_symbol_t.text = "t"
        start_symbol_a = Symbol()
        start_symbol_a.text = "a"
        start_symbol_r = Symbol()
        start_symbol_r.text = "r"
        start_symbol_tt = Symbol()
        start_symbol_tt.text = "t"

        start_word = Word()
        start_word.symbols = [start_symbol_s, start_symbol_t, start_symbol_a, start_symbol_r, start_symbol_tt]

        start_paragraph = Paragraph()
        start_paragraph.words = [start_word]

        start_block = Block()
        start_block.paragraphs = [start_paragraph]
        start_block.confidence = 0.95
        start_block.bounding_poly.vertices = [
            create_vertex_mock(10, 10), create_vertex_mock(60, 10),
            create_vertex_mock(60, 30), create_vertex_mock(10, 30)
        ]

        # Mock structure for "Process A" text block
        process_a_symbols = [unittest.mock.Mock(text=c) for c in "Process A"] # More concise
        process_a_word1 = unittest.mock.Mock(symbols=process_a_symbols[:7]) # "Process"
        process_a_word2 = unittest.mock.Mock(symbols=process_a_symbols[8:]) # "A"

        process_a_paragraph = Paragraph()
        process_a_paragraph.words = [process_a_word1, process_a_word2]

        process_a_block = Block()
        process_a_block.paragraphs = [process_a_paragraph]
        process_a_block.confidence = 0.85
        process_a_block.bounding_poly.vertices = [
            create_vertex_mock(10, 50), create_vertex_mock(100, 50),
            create_vertex_mock(100, 80), create_vertex_mock(10, 80)
        ]

        # Mock structure for "End?" text block (decision and low confidence)
        end_q_symbols = [unittest.mock.Mock(text=c) for c in "End?"]
        end_q_word = unittest.mock.Mock(symbols=end_q_symbols)
        end_q_paragraph = Paragraph()
        end_q_paragraph.words = [end_q_word]
        end_q_block = Block()
        end_q_block.paragraphs = [end_q_paragraph]
        end_q_block.confidence = 0.7 # High enough
        end_q_block.bounding_poly.vertices = [
            create_vertex_mock(10, 100), create_vertex_mock(70, 100),
            create_vertex_mock(70, 120), create_vertex_mock(10, 120)
        ]

        # Mock structure for low confidence block
        low_conf_symbols = [unittest.mock.Mock(text=c) for c in "Ignore Me"]
        low_conf_word = unittest.mock.Mock(symbols=low_conf_symbols)
        low_conf_paragraph = Paragraph()
        low_conf_paragraph.words = [low_conf_word]
        low_conf_block = Block()
        low_conf_block.paragraphs = [low_conf_paragraph]
        low_conf_block.confidence = 0.5 # Below threshold 0.6
        low_conf_block.bounding_poly.vertices = [
            create_vertex_mock(10, 150), create_vertex_mock(120, 150),
            create_vertex_mock(120, 170), create_vertex_mock(10, 170)
        ]


        page_with_blocks = Page()
        page_with_blocks.blocks = [start_block, process_a_block, end_q_block, low_conf_block]

        mock_full_text = unittest.mock.Mock()
        mock_full_text.pages = [page_with_blocks]

        # This part of text_annotations is not directly used by current logic but good to have for completeness

        # Create a new mock response object for this specific test case with data
        mock_data_response = unittest.mock.Mock()

        # Setup for text_annotations[0].bounding_poly.vertices to have len()
        first_text_annotation_mock = unittest.mock.Mock(description="Full text")
        first_text_annotation_mock.bounding_poly.vertices = [
            create_vertex_mock(0,0),
            create_vertex_mock(100,0),
            create_vertex_mock(100,100),
            create_vertex_mock(0,100)
        ] # Mock 4 vertices
        mock_data_response.text_annotations = [first_text_annotation_mock]

        mock_data_response.full_text_annotation = mock_full_text
        mock_data_response.error.message = None # Ensure no error for this successful path
        mock_client_instance.document_text_detection.return_value = mock_data_response

        # Mock for object_localization call - assume no objects found for simplicity of this test
        mock_object_response = unittest.mock.Mock()
        mock_object_response.localized_object_annotations = []
        mock_object_response.error.message = None # Crucial: no error
        mock_client_instance.object_localization.return_value = mock_object_response

        # --- Debug prints ---
        print(f"Debug: mock_data_response.full_text_annotation is {mock_data_response.full_text_annotation}")
        if mock_data_response.full_text_annotation:
           print(f"Debug: mock_data_response.full_text_annotation.pages is {mock_data_response.full_text_annotation.pages}")
           if mock_data_response.full_text_annotation.pages:
               print(f"Debug: page_with_blocks.blocks is {page_with_blocks.blocks}") # page_with_blocks is directly in scope
        # --- End Debug prints ---

        result_with_data = analyze_image_content(b"some_image_data")

        self.assertIsInstance(result_with_data, dict)
        self.assertIn("nodes", result_with_data)
        self.assertIn("edges", result_with_data)

        nodes = result_with_data["nodes"]
        edges = result_with_data["edges"]

        self.assertEqual(len(nodes), 3) # "Start", "Process A", "End?" (Ignore Me is filtered)
        self.assertEqual(len(edges), 3) # Check for the 3 heuristically created edges

        # Verify edges (order might vary, so check existence)
        expected_edges_set = {
            ("text_node_1", "text_node_2"), # Start -> Process A
            ("text_node_2", "text_node_3"), # Process A -> End?
            ("text_node_3", "text_node_2")  # End? -> Process A (Decision's "No" path, as per heuristic)
        }
        actual_edges_set = set()
        for edge in edges:
            self.assertIn("source", edge)
            self.assertIn("target", edge)
            actual_edges_set.add((edge["source"], edge["target"]))

        self.assertEqual(actual_edges_set, expected_edges_set)

        # Node 1: Start
        node1 = nodes[0]
        self.assertEqual(node1["data"]["label"], "Start")
        self.assertEqual(node1["type"], "start")
        self.assertEqual(node1["position"]["x"], 35) # Center of (10,10) (60,30)
        self.assertEqual(node1["position"]["y"], 20)

        # Node 2: Process A
        node2 = nodes[1]
        self.assertEqual(node2["data"]["label"], "Process A")
        self.assertEqual(node2["type"], "process")
        self.assertEqual(node2["position"]["x"], 55) # Center of (10,50) (100,80)
        self.assertEqual(node2["position"]["y"], 65)

        # Node 3: End?
        node3 = nodes[2]
        self.assertEqual(node3["data"]["label"], "End?")
        self.assertEqual(node3["type"], "decision")
        self.assertEqual(node3["position"]["x"], 40) # Center of (10,100) (70,120)
        self.assertEqual(node3["position"]["y"], 110)


if __name__ == '__main__':
    unittest.main()
