# Client-Side Flowchart-to-Code Conversion

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://navgurukul.github.io/Flowchart-to-Code-learning/)
[![Research Paper](https://img.shields.io/badge/paper-read-blue)](https://navgurukul.github.io/Flowchart-to-Code-learning/research.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A rule-based approach for educational contexts in resource-constrained environments

## 🎓 About

This project presents a novel client-side approach to converting flowchart images into executable JavaScript code, specifically designed for programming education in underserved communities. Unlike server-based ML approaches, our system runs entirely in the browser using open-source computer vision libraries and rule-based code generation.

**Key Features:**
- ✅ 100% client-side processing (zero server cost)
- ✅ Works offline after initial load
- ✅ Transparent rule-based approach (educational)
- ✅ 65-75% shape detection accuracy
- ✅ Privacy-preserving (images never leave device)
- ✅ Accessible on low-end devices

## 📊 Research

This work has been documented as an academic research paper:

**[Read the Full Paper →](https://navgurukul.github.io/Flowchart-to-Code-learning/research.html)**

### Abstract

Programming education in resource-constrained environments faces unique challenges, including limited internet connectivity, low-end devices, and the need for transparent, understandable tools. We present a novel client-side approach to converting flowchart images into executable JavaScript code, specifically designed for educational contexts in underserved communities. Our method achieves 65-75% accuracy in shape detection while maintaining zero infrastructure cost, complete offline capability, and full transparency.

### Citation

```bibtex
@techreport{navgurukul2026flowchart,
  title={Client-Side Flowchart-to-Code Conversion: A Rule-Based Approach for Educational Contexts},
  author={NavGurukul Engineering Team},
  institution={NavGurukul Foundation for Social Welfare},
  year={2026},
  url={https://navgurukul.github.io/Flowchart-to-Code-learning/research.html}
}
```

## 🚀 Live Demo

Try it now: **[https://navgurukul.github.io/Flowchart-to-Code-learning/](https://navgurukul.github.io/Flowchart-to-Code-learning/)**

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│         Client-Side Processing              │
├─────────────────────────────────────────────┤
│  1. Image Upload (File API)                │
│           ↓                                 │
│  2. COCO-SSD Object Detection               │
│     (TensorFlow.js, ~5MB model)             │
│           ↓                                 │
│  3. Shape Classification                    │
│     (Geometric Heuristics)                  │
│           ↓                                 │
│  4. Connection Inference                    │
│     (Spatial Proximity)                     │
│           ↓                                 │
│  5. Graph Construction                      │
│     (Adjacency List)                        │
│           ↓                                 │
│  6. Code Generation                         │
│     (Template-Based)                        │
│           ↓                                 │
│  7. Executable JavaScript Code              │
└─────────────────────────────────────────────┘
```

## 📈 Performance

| Complexity | Shapes | Detection Accuracy | Processing Time |
|------------|--------|-------------------|-----------------|
| Simple     | 3-5    | 75-85%           | 1.2s ± 0.3s    |
| Medium     | 6-10   | 65-75%           | 2.1s ± 0.5s    |
| Complex    | 11-20  | 50-65%           | 3.5s ± 0.8s    |

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite
- **Object Detection:** TensorFlow.js, COCO-SSD (MobileNet v2)
- **Styling:** Tailwind CSS
- **Database:** Firebase Realtime Database
- **Deployment:** GitHub Pages

## 💻 Local Development

### Prerequisites

- Node.js 18+ and npm
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/navgurukul/Flowchart-to-Code-learning.git
cd Flowchart-to-Code-learning

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app.

### Build for Production

```bash
npm run build
npm run preview
```

## 🎯 Use Cases

### For Students
- Learn algorithmic thinking through flowcharts
- Convert hand-drawn flowcharts to code
- Understand the connection between visual logic and code
- Practice programming without writing syntax initially

### For Educators
- Teach programming concepts visually
- Assess student understanding of algorithms
- Provide immediate feedback on flowchart logic
- Bridge the gap between pseudocode and real code

### For Researchers
- Study flowchart-to-code conversion approaches
- Explore trade-offs between accuracy and accessibility
- Contribute to educational technology research
- Build upon our open-source implementation

## 🌍 Impact

Deployed in **NavGurukul Foundation's** programming curriculum, serving students from marginalized communities across India. Our approach prioritizes:

- **Accessibility** over maximum accuracy
- **Transparency** over black-box solutions
- **Sustainability** over expensive infrastructure
- **Education** over pure automation

## 📚 Documentation

- [Research Paper](https://navgurukul.github.io/Flowchart-to-Code-learning/research.html) - Full academic paper
- [LaTeX Source](docs/paper/paper.tex) - arXiv-ready LaTeX version
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute
- [Implementation Plans](docs/) - Technical documentation

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

Areas where we need help:
- Improving shape detection accuracy
- Adding OCR for text extraction
- Supporting more programming languages
- Hindi language support
- Documentation and tutorials

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Students** at NavGurukul for testing and feedback
- **Open-source community** for TensorFlow.js, COCO-SSD, and other tools
- **Researchers** working on flowchart recognition and code generation

## 📧 Contact

**NavGurukul Foundation for Social Welfare**

- Website: [navgurukul.org](https://www.navgurukul.org/)
- Email: contact@navgurukul.org
- GitHub: [@navgurukul](https://github.com/navgurukul)

## 🌟 Star History

If you find this project useful, please consider giving it a star ⭐

---

**Made with ❤️ by NavGurukul Foundation**

*Making quality programming education accessible to all*
