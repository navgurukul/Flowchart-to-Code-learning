# Flowchart Image to Code Conversion - NavGurukul Implementation Plan

## Legal & Copyright Considerations ⚖️

### What We CANNOT Use:
- ❌ FloCo-T5 model (proprietary research)
- ❌ FloCo dataset (requires citation and permission)
- ❌ Their specific transformer architecture
- ❌ Their pre-training methodology
- ❌ Any code from their repository without proper licensing

### What We CAN Use (Safe & Legal):
- ✅ OpenCV.js (BSD License - Free to use)
- ✅ TensorFlow.js (Apache 2.0 License - Free to use)
- ✅ Open-source OCR (Tesseract.js - Apache 2.0)
- ✅ Our own training data (created by NavGurukul)
- ✅ Public domain algorithms (shape detection, graph traversal)
- ✅ Open-source pre-trained models (MobileNet, etc.)

## Our Approach: 100% Client-Side, 100% Legal

### Phase 1: Shape Detection (OpenCV.js)
**Technology**: OpenCV.js (BSD License)
**Accuracy**: 70-85%

```
Image → Preprocessing → Shape Detection → Classification
```

**Steps**:
1. Convert image to grayscale
2. Apply edge detection (Canny)
3. Find contours
4. Classify shapes by geometry:
   - Circles/Ovals → Start/End
   - Rectangles → Process
   - Diamonds → Decision
   - Parallelograms → Input/Output

### Phase 2: Connection Detection
**Technology**: Custom algorithm (no copyright)
**Accuracy**: 60-75%

```
Shapes → Line Detection → Arrow Detection → Graph Building
```

**Steps**:
1. Detect lines using Hough Transform
2. Find arrow heads (triangle detection)
3. Connect shapes based on line endpoints
4. Build directed graph

### Phase 3: Text Recognition (OCR)
**Technology**: Tesseract.js (Apache 2.0)
**Accuracy**: 80-90% for printed text

```
Shape Regions → OCR → Text Extraction → Label Assignment
```

### Phase 4: Code Generation
**Technology**: Custom rule-based system (no ML needed)
**Accuracy**: 90-95% (if graph is correct)

```
Graph + Labels → Traversal → Code Template → Python/JavaScript
```

**Algorithm**:
1. Topological sort of flowchart graph
2. Identify patterns (loops, conditionals)
3. Generate code using templates
4. Format and validate syntax

## Implementation Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Browser (Client-Side)              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Image Upload                                    │
│     ↓                                               │
│  2. OpenCV.js Shape Detection                       │
│     ↓                                               │
│  3. Tesseract.js OCR                                │
│     ↓                                               │
│  4. Graph Builder (Custom)                          │
│     ↓                                               │
│  5. Code Generator (Custom)                         │
│     ↓                                               │
│  6. Display Code + Flowchart                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## File Structure

```
src/services/
├── flowchartDetection/
│   ├── shapeDetector.ts       # OpenCV.js shape detection
│   ├── connectionDetector.ts  # Line/arrow detection
│   ├── ocrService.ts          # Tesseract.js OCR
│   ├── graphBuilder.ts        # Build flowchart graph
│   └── codeGenerator.ts       # Generate Python/JS code
```

## Advantages Over FloCo

1. **No Copyright Issues**: 100% our own implementation
2. **Client-Side**: No server needed, works offline
3. **Transparent**: Users see each step
4. **Educational**: Students learn how it works
5. **Customizable**: Easy to add new shape types
6. **Free**: No API costs or licensing fees

## Limitations (Be Honest)

1. **Accuracy**: 60-75% vs FloCo's 85%+ (they use ML)
2. **Handwritten**: Works better with printed/digital flowcharts
3. **Complex Flowcharts**: May struggle with 20+ shapes
4. **Curved Lines**: Better with straight arrows
5. **Overlapping**: Shapes shouldn't overlap

## Recommended Approach

### Option A: Rule-Based (Recommended for NavGurukul)
- **Pros**: No copyright, fast, transparent, educational
- **Cons**: Lower accuracy than ML
- **Best for**: Educational use, simple flowcharts

### Option B: Train Our Own Model (Future)
- **Pros**: Higher accuracy, custom to our needs
- **Cons**: Requires dataset creation, training time
- **Legal**: 100% safe if we create our own dataset
- **Timeline**: 3-6 months

### Option C: Hybrid Approach (Best Balance)
- Use OpenCV for shape detection (70% accuracy)
- Use simple ML for shape classification (boost to 80%)
- Use rule-based for code generation (90% accuracy)
- **Overall**: 65-75% end-to-end accuracy

## Implementation Timeline

### Week 1-2: Shape Detection
- Integrate OpenCV.js
- Implement shape detection algorithms
- Test with sample flowcharts

### Week 3: Connection Detection
- Line detection with Hough Transform
- Arrow detection
- Graph building

### Week 4: OCR Integration
- Integrate Tesseract.js
- Extract text from shapes
- Handle Hindi text (if needed)

### Week 5-6: Code Generation
- Implement graph traversal
- Create code templates
- Generate Python/JavaScript

### Week 7: Testing & Refinement
- Test with real student flowcharts
- Improve accuracy
- Add error handling

## Cost Analysis

| Component | Cost | License |
|-----------|------|---------|
| OpenCV.js | FREE | BSD |
| Tesseract.js | FREE | Apache 2.0 |
| TensorFlow.js | FREE | Apache 2.0 |
| Hosting | FREE | GitHub Pages |
| **Total** | **₹0** | **100% Legal** |

## Legal Checklist ✅

- [ ] No code copied from FloCo repository
- [ ] No use of FloCo dataset
- [ ] No use of FloCo-T5 model
- [ ] All libraries are open-source with permissive licenses
- [ ] Our own algorithms and implementations
- [ ] Proper attribution to open-source libraries
- [ ] No patent infringement (using public domain algorithms)

## References (For Learning, Not Copying)

We can READ these papers to understand the problem, but NOT copy their code:
- FloCo paper (for understanding the problem)
- OpenCV documentation (for implementation)
- Graph theory textbooks (for algorithms)

## Next Steps

1. **Get Approval**: Confirm this approach with NavGurukul team
2. **Prototype**: Build basic shape detection in 1 week
3. **Test**: Try with 10 sample flowcharts
4. **Iterate**: Improve based on results
5. **Deploy**: Add to existing platform

## Expected Results

- **Simple Flowcharts (3-5 shapes)**: 75-85% accuracy
- **Medium Flowcharts (6-10 shapes)**: 65-75% accuracy
- **Complex Flowcharts (11+ shapes)**: 50-65% accuracy

This is honest and realistic for a rule-based system.

## Conclusion

We can build a flowchart-to-code system that:
- ✅ Works entirely in the browser
- ✅ Has ZERO copyright issues
- ✅ Costs ZERO money
- ✅ Is educational and transparent
- ✅ Serves NavGurukul's mission

It won't be as accurate as FloCo's ML approach, but it will be:
- Legal
- Free
- Educational
- Good enough for learning

---

**Created for**: NavGurukul Labs
**Date**: 2026-02-21
**Status**: Planning Phase
