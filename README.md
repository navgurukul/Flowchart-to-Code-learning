# Client-Side Flowchart-to-Code Conversion

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://navgurukul.github.io/Flowchart-to-Code-learning/)
[![Documentation](https://img.shields.io/badge/docs-read-blue)](https://navgurukul.github.io/Flowchart-to-Code-learning/research.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Converting flowchart images to executable JavaScript code, entirely in the browser. Built for programming education in resource-constrained environments.

## Why This Matters

**65-75% accuracy. Zero server cost. 100% transparent.**

Unlike ML-based approaches requiring expensive infrastructure, our system runs entirely client-side using COCO-SSD and rule-based code generation. It's designed for students with limited internet and low-end devices.

**[Try it now →](https://navgurukul.github.io/Flowchart-to-Code-learning/)** | **[Read documentation →](https://navgurukul.github.io/Flowchart-to-Code-learning/research.html)**

## Key Features

- ✅ **Client-side processing** - Works offline, zero server cost
- ✅ **Educational transparency** - Students see how it works
- ✅ **Privacy-first** - Images never leave the device
- ✅ **Accessible** - Runs on low-end devices

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

## How It Works

```
Image → COCO-SSD Detection → Shape Classification → 
Graph Construction → Code Generation → JavaScript
```

**Performance:**
- Simple flowcharts (3-5 shapes): 75-85% accuracy, ~1.2s
- Medium (6-10 shapes): 65-75% accuracy, ~2.1s
- Complex (11+ shapes): 50-65% accuracy, ~3.5s

## Documentation

Full technical documentation available at: **[navgurukul.github.io/Flowchart-to-Code-learning/research.html](https://navgurukul.github.io/Flowchart-to-Code-learning/research.html)**

## Tech Stack

React 18 • TypeScript • TensorFlow.js • COCO-SSD • Firebase • Tailwind CSS

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Priority areas:**
- Shape detection improvements (OpenCV.js integration)
- OCR for text extraction (Tesseract.js)
- Hindi language support
- More programming languages

## Impact

Deployed in NavGurukul Foundation's curriculum, serving students from marginalized communities across India. We prioritize accessibility and transparency over maximum accuracy.

## License

MIT License - see [LICENSE](LICENSE)

---

**NavGurukul Foundation** | [navgurukul.org](https://www.navgurukul.org/) | contact@navgurukul.org

*Making quality programming education accessible to all*
